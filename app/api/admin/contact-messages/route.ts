import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth/server';
import { Timestamp, type Query } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const pageSize = Math.min(Number(searchParams.get('pageSize') || 20), 50);
    const cursor = searchParams.get('cursor');

    let query: Query = adminDb.collection('contactMessages');

    if (search) {
      const searchLower = search.toLowerCase();
      query = query
        .orderBy('subjectLower')
        .orderBy('createdAt', 'desc')
        .where('subjectLower', '>=', searchLower)
        .where('subjectLower', '<=', `${searchLower}\uf8ff`);
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    if (status && ['new', 'open', 'closed'].includes(status)) {
      query = query.where('status', '==', status);
    }

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!Number.isNaN(cursorDate.getTime())) {
        query = query.startAfter(Timestamp.fromDate(cursorDate));
      }
    }

    query = query.limit(pageSize);

    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
      };
    });

    const last = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = last?.data().createdAt?.toDate ? last.data().createdAt.toDate().toISOString() : null;

    return NextResponse.json({ items, nextCursor });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Failed to fetch contact messages:', error);
    return NextResponse.json({ error: 'Failed to fetch contact messages' }, { status: 500 });
  }
}
