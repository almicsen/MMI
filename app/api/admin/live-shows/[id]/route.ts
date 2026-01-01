import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/server';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

const liveShowUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  prize: z.number().nonnegative().optional(),
  startTime: z.string().optional(),
  status: z.enum(['scheduled', 'live', 'ended']).optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const body = liveShowUpdateSchema.parse(await request.json());
    const updates: Record<string, unknown> = {
      updatedAt: Timestamp.fromDate(new Date()),
    };
    if (body.title !== undefined) updates.title = body.title;
    if (body.prize !== undefined) updates.prize = body.prize;
    if (body.status !== undefined) updates.status = body.status;
    if (body.startTime) {
      const startDate = new Date(body.startTime);
      if (Number.isNaN(startDate.getTime())) {
        return NextResponse.json({ error: 'Invalid start time' }, { status: 400 });
      }
      updates.startTime = Timestamp.fromDate(startDate);
    }
    await adminDb.collection('liveShows').doc(id).update(updates);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin live schedule update failed:', error);
    return NextResponse.json({ error: 'Unable to update live show' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    await adminDb.collection('liveShows').doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin live schedule delete failed:', error);
    return NextResponse.json({ error: 'Unable to delete live show' }, { status: 500 });
  }
}
