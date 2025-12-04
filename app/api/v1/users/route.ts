import { NextRequest, NextResponse } from 'next/server';
import { apiSecurityMiddleware, createErrorResponse, logAPIUsage, cleanupRequest } from '@/lib/api/security';
import { getClientIP } from '@/lib/api/security-enhanced';
import { getUsers } from '@/lib/firebase/firestore';

/**
 * Users API Endpoint
 * GET /api/v1/users - List users (admin only)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);
  
  try {
    // Require API key with 'read' scope - with enhanced security
    const { keyData, error } = await apiSecurityMiddleware(request, ['read'], '/api/v1/users');
    
    if (error || !keyData) {
      cleanupRequest(ip);
      return error || createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    try {
    // In a real implementation, you'd check if the user is admin
    // For now, we'll allow any authenticated API key
    const users = await getUsers();
    
    // Remove sensitive data
    const publicUsers = users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      // Don't expose progress, permissions, etc. unless specifically requested
    }));

    const response = NextResponse.json({
      success: true,
      data: publicUsers,
      count: publicUsers.length,
    });

    await logAPIUsage(keyData, '/api/v1/users', 'GET', 200, Date.now() - startTime, request);
    return response;
  } catch (error: any) {
    const response = createErrorResponse(error.message || 'Internal server error', 500, 'INTERNAL_ERROR');
      await logAPIUsage(keyData, '/api/v1/users', 'GET', 500, Date.now() - startTime, request);
      return response;
    } finally {
      cleanupRequest(ip);
    }
  } catch (error: any) {
    cleanupRequest(ip);
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

