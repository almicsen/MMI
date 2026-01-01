import { randomUUID } from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

import { createToken, hashToken, SESSION_ROTATION_DAYS, SESSION_TTL_DAYS } from './sessionManager';

export const SESSION_COOKIE = 'mmi_session';
export { SESSION_TTL_DAYS, SESSION_ROTATION_DAYS };

export interface SessionRecord {
  userId: string;
  sessionId: string;
  tokenHash: string;
  createdAt: Date;
  lastActiveAt: Date;
  lastRotatedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  revokeReason?: string;
  rotatedTo?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface SessionMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
}

const sessionCollection = adminDb.collection('sessions');

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export { hashToken, createToken };

function parseSessionRecord(data: FirebaseFirestore.DocumentData): SessionRecord {
  return {
    userId: data.userId,
    sessionId: data.sessionId,
    tokenHash: data.tokenHash,
    createdAt: data.createdAt.toDate(),
    lastActiveAt: data.lastActiveAt.toDate(),
    lastRotatedAt: data.lastRotatedAt?.toDate ? data.lastRotatedAt.toDate() : data.lastActiveAt.toDate(),
    expiresAt: data.expiresAt.toDate(),
    revokedAt: data.revokedAt?.toDate ? data.revokedAt.toDate() : null,
    revokeReason: data.revokeReason,
    rotatedTo: data.rotatedTo,
    userAgent: data.userAgent ?? null,
    ipAddress: data.ipAddress ?? null,
  };
}

export async function createSession(userId: string, metadata: SessionMetadata) {
  const token = createToken();
  const tokenHashValue = hashToken(token);
  const now = new Date();
  const expiresAt = addDays(now, SESSION_TTL_DAYS);
  const sessionId = randomUUID();

  await sessionCollection.doc(tokenHashValue).set({
    userId,
    sessionId,
    tokenHash: tokenHashValue,
    createdAt: Timestamp.fromDate(now),
    lastActiveAt: Timestamp.fromDate(now),
    lastRotatedAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
    revokedAt: null,
    revokeReason: null,
    rotatedTo: null,
    userAgent: metadata.userAgent ?? null,
    ipAddress: metadata.ipAddress ?? null,
  });

  return {
    token,
    record: {
      userId,
      sessionId,
      tokenHash: tokenHashValue,
      createdAt: now,
      lastActiveAt: now,
      lastRotatedAt: now,
      expiresAt,
      revokedAt: null,
      revokeReason: undefined,
      rotatedTo: null,
      userAgent: metadata.userAgent ?? null,
      ipAddress: metadata.ipAddress ?? null,
    } satisfies SessionRecord,
  };
}

export async function getSessionByToken(token: string): Promise<SessionRecord | null> {
  const tokenHashValue = hashToken(token);
  const snapshot = await sessionCollection.doc(tokenHashValue).get();
  if (!snapshot.exists) return null;
  return parseSessionRecord(snapshot.data()!);
}

export async function touchSession(token: string) {
  const tokenHashValue = hashToken(token);
  const snapshot = await sessionCollection.doc(tokenHashValue).get();
  if (!snapshot.exists) return null;

  const record = parseSessionRecord(snapshot.data()!);
  if (record.revokedAt) return null;

  const now = new Date();
  if (record.expiresAt.getTime() <= now.getTime()) {
    await sessionCollection.doc(tokenHashValue).update({
      revokedAt: Timestamp.fromDate(now),
      revokeReason: 'expired',
    });
    return null;
  }

  const updatedExpiresAt = addDays(now, SESSION_TTL_DAYS);
  await sessionCollection.doc(tokenHashValue).update({
    lastActiveAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(updatedExpiresAt),
  });

  return {
    ...record,
    lastActiveAt: now,
    expiresAt: updatedExpiresAt,
  } satisfies SessionRecord;
}

export async function rotateSession(token: string, metadata: SessionMetadata) {
  const tokenHashValue = hashToken(token);
  const snapshot = await sessionCollection.doc(tokenHashValue).get();
  if (!snapshot.exists) return null;

  const record = parseSessionRecord(snapshot.data()!);
  if (record.revokedAt) return null;

  const now = new Date();
  const rotationThreshold = new Date(record.lastRotatedAt);
  rotationThreshold.setDate(rotationThreshold.getDate() + SESSION_ROTATION_DAYS);

  if (now < rotationThreshold) {
    const touched = await touchSession(token);
    return touched
      ? { rotated: false, token, record: touched }
      : null;
  }

  const next = await createSession(record.userId, metadata);
  await sessionCollection.doc(tokenHashValue).update({
    revokedAt: Timestamp.fromDate(now),
    revokeReason: 'rotated',
    rotatedTo: next.record.sessionId,
    lastRotatedAt: Timestamp.fromDate(now),
  });

  return { rotated: true, token: next.token, record: next.record };
}

export async function revokeSession(token: string, reason: string) {
  const tokenHashValue = hashToken(token);
  const snapshot = await sessionCollection.doc(tokenHashValue).get();
  if (!snapshot.exists) return;

  const now = new Date();
  await sessionCollection.doc(tokenHashValue).update({
    revokedAt: Timestamp.fromDate(now),
    revokeReason: reason,
  });
}
