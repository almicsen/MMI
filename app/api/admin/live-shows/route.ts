import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/server';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

const liveShowInputSchema = z.object({
  title: z.string().min(1).max(120),
  prize: z.number().nonnegative(),
  startTime: z.string().min(1),
  status: z.enum(['scheduled', 'live', 'ended']),
});

function serializeShow(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data() || {};
  const startTime = data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime);
  return {
    id: doc.id,
    title: data.title || '',
    prize: data.prize || 0,
    startTime: startTime.toISOString(),
    status: data.status || 'scheduled',
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const snapshot = await adminDb.collection('liveShows').orderBy('startTime', 'asc').limit(50).get();
    const items = snapshot.docs.map((doc) => serializeShow(doc));
    return NextResponse.json({ items });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin live schedule load failed:', error);
    return NextResponse.json({ error: 'Unable to load live schedule' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = liveShowInputSchema.parse(await request.json());
    const startDate = new Date(body.startTime);
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'Invalid start time' }, { status: 400 });
    }
    const docRef = await adminDb.collection('liveShows').add({
      title: body.title,
      prize: body.prize,
      startTime: Timestamp.fromDate(startDate),
      status: body.status,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin live schedule create failed:', error);
    return NextResponse.json({ error: 'Unable to create live show' }, { status: 500 });
  }
}
