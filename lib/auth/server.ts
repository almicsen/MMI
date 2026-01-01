import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionByToken, touchSession, SESSION_COOKIE } from './session';
import { UserRole } from '@/lib/firebase/types';

export async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await touchSession(token);
  return session;
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const docSnap = await adminDb.collection('users').doc(userId).get();
  if (!docSnap.exists) return null;
  const data = docSnap.data();
  return (data?.role as UserRole) || null;
}

export async function requireSession(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function requireAdmin(request: NextRequest) {
  const session = await requireSession(request);
  const role = await getUserRole(session.userId);
  const overrideList = (process.env.ADMIN_UIDS || process.env.ADMIN_UID || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const override = overrideList.includes(session.userId);
  if (role !== 'admin' && !override) {
    throw new Error('FORBIDDEN');
  }
  return { session, role };
}
