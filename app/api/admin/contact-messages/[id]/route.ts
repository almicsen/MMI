import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/server';
import { contactMessageUpdateSchema } from '@/lib/validators/contactMessage';
import { Timestamp } from 'firebase-admin/firestore';
import { logAdminAction } from '@/lib/admin/auditLog';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const docSnap = await adminDb.collection('contactMessages').doc(id).get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const data = docSnap.data()!;
    return NextResponse.json({
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to fetch contact message:', error);
    return NextResponse.json({ error: 'Failed to fetch contact message' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session } = await requireAdmin(request);
    const body = contactMessageUpdateSchema.parse(await request.json());
    const now = new Date();
    const { id } = await params;

    await adminDb.collection('contactMessages').doc(id).update({
      ...body,
      updatedAt: Timestamp.fromDate(now),
    });

    await logAdminAction({
      actorId: session.userId,
      action: 'contact-message:update',
      targetType: 'contact-message',
      targetId: id,
      metadata: body,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to update contact message:', error);
    return NextResponse.json({ error: 'Failed to update contact message' }, { status: 400 });
  }
}
