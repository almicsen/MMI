import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireSession } from '@/lib/auth/server';
import { contactMessageCreateSchema } from '@/lib/validators/contactMessage';
import { sanitizePlainText } from '@/lib/utils/sanitize';
import { Timestamp } from 'firebase-admin/firestore';
import { enforceRateLimit } from '@/lib/api/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = contactMessageCreateSchema.parse(await request.json());

    const rateKey = `contact:${session.userId}`;
    const rateLimit = await enforceRateLimit(rateKey, 5, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetAt: rateLimit.resetAt.toISOString() },
        { status: 429 }
      );
    }

    const now = new Date();
    const messageDoc = {
      userId: session.userId,
      name: body.name ? sanitizePlainText(body.name) : null,
      email: body.email ? body.email.toLowerCase() : null,
      subject: sanitizePlainText(body.subject),
      subjectLower: sanitizePlainText(body.subject).toLowerCase(),
      message: sanitizePlainText(body.message),
      status: 'new',
      tags: [],
      internalNotes: null,
      assignedTo: null,
      metadata: {
        ...body.metadata,
        userAgent: body.metadata?.userAgent || request.headers.get('user-agent'),
      },
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    const docRef = await adminDb.collection('contactMessages').add(messageDoc);

    return NextResponse.json({ id: docRef.id });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to create contact message:', error);
    return NextResponse.json({ error: 'Unable to submit contact message' }, { status: 400 });
  }
}
