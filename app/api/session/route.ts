import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import {
  createSession,
  getSessionByToken,
  revokeSession,
  rotateSession,
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
} from '@/lib/auth/session';
import { z } from 'zod';
import { enforceRateLimit } from '@/lib/api/rateLimit';

const createSessionSchema = z.object({
  idToken: z.string().min(1),
});

function getRequestMetadata(request: NextRequest) {
  return {
    userAgent: request.headers.get('user-agent'),
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
  };
}

function withSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * SESSION_TTL_DAYS,
    path: '/',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = createSessionSchema.parse(await request.json());
    const metadata = getRequestMetadata(request);
    const rateKey = `session:${metadata.ipAddress || 'unknown'}`;
    if (process.env.NODE_ENV === 'production') {
      const rateLimit = await enforceRateLimit(rateKey, 20, 10 * 60 * 1000);
      if (!rateLimit.allowed) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }
    }
    const decoded = await adminAuth.verifyIdToken(body.idToken, true);
    const userId = decoded.uid;

    const existingToken = request.cookies.get(SESSION_COOKIE)?.value;
    if (existingToken) {
      const existing = await getSessionByToken(existingToken);
      if (existing && existing.userId === userId) {
        const rotated = await rotateSession(existingToken, metadata);
        if (rotated) {
          const response = NextResponse.json({
            userId,
            expiresAt: rotated.record.expiresAt.toISOString(),
            rotated: rotated.rotated,
          });
          withSessionCookie(response, rotated.token);
          return response;
        }
      } else if (existing) {
        await revokeSession(existingToken, 'replaced');
      }
    }

    const session = await createSession(userId, metadata);
    const response = NextResponse.json({
      userId,
      expiresAt: session.record.expiresAt.toISOString(),
    });
    withSessionCookie(response, session.token);
    return response;
  } catch (error) {
    console.error('Session creation failed:', error);
    return NextResponse.json({ error: 'Unable to create session' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  const metadata = getRequestMetadata(request);
  const rotated = await rotateSession(token, metadata);
  if (!rotated) {
    return NextResponse.json({ error: 'Session invalid' }, { status: 401 });
  }

  const response = NextResponse.json({
    userId: rotated.record.userId,
    expiresAt: rotated.record.expiresAt.toISOString(),
    rotated: rotated.rotated,
  });
  withSessionCookie(response, rotated.token);
  return response;
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await revokeSession(token, 'logout');
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });
  return response;
}
