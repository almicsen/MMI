import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { mapLiveShow } from '@/lib/live/transform';
import { enforceRateLimit } from '@/lib/api/rateLimit';
import { requireSession } from '@/lib/auth/server';

async function isLiveEnabled(): Promise<boolean> {
  const configDoc = await adminDb.collection('config').doc('main').get();
  return configDoc.exists ? configDoc.data()?.liveEnabled === true : false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const rateKey = `live-schedule:${session.userId}`;
    const rateLimit = await enforceRateLimit(rateKey, 30, 5 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const enabled = await isLiveEnabled();
    if (!enabled) {
      return NextResponse.json({ error: 'Live disabled' }, { status: 404 });
    }

    const snapshot = await adminDb
      .collection('liveShows')
      .orderBy('startTime', 'asc')
      .limit(12)
      .get();

    const items = snapshot.docs
      .map((doc) => mapLiveShow(doc.id, doc.data()))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter((item) => item.status !== 'ended')
      .filter((item) => item.status === 'live' || item.startTime.getTime() >= Date.now())
      .map((item) => ({
        ...item,
        startTime: item.startTime.toISOString(),
      }));

    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to load live schedule:', error);
    return NextResponse.json({ error: 'Failed to load live schedule' }, { status: 500 });
  }
}
