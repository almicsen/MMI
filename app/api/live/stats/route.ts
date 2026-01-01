import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireSession } from '@/lib/auth/server';
import { enforceRateLimit } from '@/lib/api/rateLimit';
import { liveStatsSchema } from '@/lib/validators/live';
import { Timestamp } from 'firebase-admin/firestore';

async function isLiveEnabled(): Promise<boolean> {
  const configDoc = await adminDb.collection('config').doc('main').get();
  return configDoc.exists ? configDoc.data()?.liveEnabled === true : false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const rateKey = `live-stats:${session.userId}`;
    const rateLimit = await enforceRateLimit(rateKey, 30, 5 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const enabled = await isLiveEnabled();
    if (!enabled) {
      return NextResponse.json({ error: 'Live disabled' }, { status: 404 });
    }

    const statsRef = adminDb.collection('liveStats').doc(session.userId);
    const statsDoc = await statsRef.get();
    let data = statsDoc.exists ? statsDoc.data() : null;

    if (!data) {
      data = {
        balance: 0,
        hearts: 0,
        weeklyRank: 0,
        updatedAt: Timestamp.fromDate(new Date()),
      };
      await statsRef.set(data, { merge: true });
    }

    const parsed = liveStatsSchema.parse(data);

    return NextResponse.json(
      {
        balance: parsed.balance,
        hearts: parsed.hearts,
        weeklyRank: parsed.weeklyRank,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to load live stats:', error);
    return NextResponse.json({ error: 'Failed to load live stats' }, { status: 500 });
  }
}
