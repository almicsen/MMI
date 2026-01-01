import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const ref = adminDb.collection('rateLimits').doc(key);
  const now = new Date();

  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      transaction.set(ref, {
        count: 1,
        windowStart: Timestamp.fromDate(now),
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: new Date(now.getTime() + windowMs),
      };
    }

    const data = snapshot.data()!;
    const windowStart = data.windowStart?.toDate ? data.windowStart.toDate() : new Date(0);
    const elapsed = now.getTime() - windowStart.getTime();

    if (elapsed > windowMs) {
      transaction.set(ref, {
        count: 1,
        windowStart: Timestamp.fromDate(now),
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: new Date(now.getTime() + windowMs),
      };
    }

    if (data.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(windowStart.getTime() + windowMs),
      };
    }

    transaction.update(ref, {
      count: data.count + 1,
    });

    return {
      allowed: true,
      remaining: limit - (data.count + 1),
      resetAt: new Date(windowStart.getTime() + windowMs),
    };
  });
}
