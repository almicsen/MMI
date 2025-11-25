import { NextRequest, NextResponse } from 'next/server';
import { getDDoSStats } from '@/lib/api/ddos-protection';
import { getClientIP } from '@/lib/api/security-enhanced';
import { apiSecurityMiddleware } from '@/lib/api/security';

/**
 * DDoS Protection Statistics Endpoint (Admin Only)
 * GET /api/ddos-stats - Get DDoS protection statistics
 */
export async function GET(request: NextRequest) {
  // Require admin API key
  const { keyData, error } = await apiSecurityMiddleware(request, ['*'], '/api/ddos-stats');
  
  if (error || !keyData) {
    return error || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const searchParams = request.nextUrl.searchParams;
  const ip = searchParams.get('ip') || undefined;
  
  const stats = getDDoSStats(ip);
  
  return NextResponse.json({
    success: true,
    data: stats,
  });
}

