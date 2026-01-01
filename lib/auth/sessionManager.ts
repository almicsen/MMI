import crypto from 'crypto';

export const SESSION_TTL_DAYS = 30;
export const SESSION_ROTATION_DAYS = 7;

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

export interface SessionStore {
  get(tokenHash: string): Promise<SessionRecord | null>;
  set(record: SessionRecord): Promise<void>;
  update(tokenHash: string, updates: Partial<SessionRecord>): Promise<void>;
}

export interface SessionResult {
  token: string;
  record: SessionRecord;
  rotated?: boolean;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createSessionManager(store: SessionStore) {
  const createSession = async (userId: string, metadata: SessionMetadata): Promise<SessionResult> => {
    const token = createToken();
    const tokenHash = hashToken(token);
    const now = new Date();
    const record: SessionRecord = {
      userId,
      sessionId: crypto.randomUUID(),
      tokenHash,
      createdAt: now,
      lastActiveAt: now,
      lastRotatedAt: now,
      expiresAt: addDays(now, SESSION_TTL_DAYS),
      revokedAt: null,
      revokeReason: undefined,
      rotatedTo: null,
      userAgent: metadata.userAgent ?? null,
      ipAddress: metadata.ipAddress ?? null,
    };
    await store.set(record);
    return { token, record };
  };

  const touchSession = async (token: string): Promise<SessionRecord | null> => {
    const tokenHash = hashToken(token);
    const record = await store.get(tokenHash);
    if (!record || record.revokedAt) return null;

    const now = new Date();
    if (record.expiresAt.getTime() <= now.getTime()) {
      await store.update(tokenHash, { revokedAt: now, revokeReason: 'expired' });
      return null;
    }

    const updated = {
      ...record,
      lastActiveAt: now,
      expiresAt: addDays(now, SESSION_TTL_DAYS),
    };
    await store.update(tokenHash, {
      lastActiveAt: updated.lastActiveAt,
      expiresAt: updated.expiresAt,
    });

    return updated;
  };

  const rotateSession = async (token: string, metadata: SessionMetadata): Promise<SessionResult | null> => {
    const tokenHash = hashToken(token);
    const record = await store.get(tokenHash);
    if (!record || record.revokedAt) return null;

    const now = new Date();
    const rotationAt = new Date(record.lastRotatedAt);
    rotationAt.setDate(rotationAt.getDate() + SESSION_ROTATION_DAYS);

    if (now < rotationAt) {
      const touched = await touchSession(token);
      return touched ? { token, record: touched, rotated: false } : null;
    }

    const next = await createSession(record.userId, metadata);
    await store.update(tokenHash, {
      revokedAt: now,
      revokeReason: 'rotated',
      rotatedTo: next.record.sessionId,
      lastRotatedAt: now,
    });

    return { ...next, rotated: true };
  };

  const revokeSession = async (token: string, reason: string) => {
    const tokenHash = hashToken(token);
    const record = await store.get(tokenHash);
    if (!record) return;
    await store.update(tokenHash, { revokedAt: new Date(), revokeReason: reason });
  };

  return {
    createSession,
    touchSession,
    rotateSession,
    revokeSession,
  };
}
