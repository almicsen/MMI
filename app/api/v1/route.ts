import { NextRequest, NextResponse } from 'next/server';
import { apiSecurityMiddleware, createErrorResponse, logAPIUsage } from '@/lib/api/security';

/**
 * API v1 Base Route
 * Returns API information and available endpoints
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Check API key (optional for info endpoint)
  const { keyData, error } = await apiSecurityMiddleware(request, []);
  
  if (error && !keyData) {
    // Still return API info even without key, but log the attempt
    const response = NextResponse.json({
      name: 'MMI API',
      version: '1.0.0',
      message: 'API key required for most endpoints',
      endpoints: {
        info: '/api/v1',
        content: '/api/v1/content',
        notifications: '/api/v1/notifications',
        users: '/api/v1/users',
      },
      authentication: {
        method: 'API Key',
        header: 'X-API-Key or Authorization: Bearer <key>',
      },
      documentation: '/api/docs',
    });
    
    if (error) {
      return error;
    }
    return response;
  }

  const response = NextResponse.json({
    name: 'MMI API',
    version: '1.0.0',
    authenticated: !!keyData,
    endpoints: {
      info: '/api/v1',
      content: '/api/v1/content',
      notifications: '/api/v1/notifications',
      users: '/api/v1/users',
    },
    scopes: keyData?.scopes || [],
    documentation: '/api/docs',
  });

  if (keyData) {
    await logAPIUsage(keyData, '/api/v1', 'GET', 200, Date.now() - startTime, request);
  }

  return response;
}

