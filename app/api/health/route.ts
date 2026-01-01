import { NextRequest, NextResponse } from 'next/server';
import { getHealthCheckData } from '@/lib/api/security-hardening';

/**
 * Health Check Endpoint
 * GET /api/health - System health and security status
 */
export async function GET(request: NextRequest) {
  const health = getHealthCheckData();
  let firestoreStatus = 'unknown';
  try {
    const { adminDb } = await import('@/lib/firebase/admin');
    await adminDb.collection('config').limit(1).get();
    firestoreStatus = 'ok';
  } catch (error) {
    firestoreStatus = 'error';
    console.error('Health check Firestore error:', error);
  }
  const response = {
    ...health,
    dependencies: {
      firestore: firestoreStatus,
    },
  };
  
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  
  return NextResponse.json(response, { status: statusCode });
}
