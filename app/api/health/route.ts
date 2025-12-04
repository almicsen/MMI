import { NextRequest, NextResponse } from 'next/server';
import { getHealthCheckData } from '@/lib/api/security-hardening';

/**
 * Health Check Endpoint
 * GET /api/health - System health and security status
 */
export async function GET(request: NextRequest) {
  const health = getHealthCheckData();
  
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  
  return NextResponse.json(health, { status: statusCode });
}

