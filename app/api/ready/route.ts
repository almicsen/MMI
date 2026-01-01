import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { adminDb } = await import('@/lib/firebase/admin');
    await adminDb.collection('config').limit(1).get();
    return NextResponse.json({ status: 'ready' });
  } catch (error) {
    console.error('Readiness check failed:', error);
    return NextResponse.json({ status: 'not_ready' }, { status: 503 });
  }
}
