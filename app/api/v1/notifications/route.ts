import { NextRequest, NextResponse } from 'next/server';
import { apiSecurityMiddleware, createErrorResponse, logAPIUsage, cleanupRequest } from '@/lib/api/security';
import { getClientIP } from '@/lib/api/security-enhanced';
import { sendSiteNotification } from '@/lib/firebase/siteNotifications';

/**
 * Notifications API Endpoint
 * POST /api/v1/notifications - Send a notification
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);
  
  try {
    // Require API key with 'notifications' scope - with enhanced security
    const { keyData, error } = await apiSecurityMiddleware(request, ['notifications', 'write'], '/api/v1/notifications');
    
    if (error || !keyData) {
      cleanupRequest(ip);
      return error || createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    try {
    const body = await request.json();
    const { userIds, title, message, type, link, openInAppBrowser } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return createErrorResponse('userIds array is required', 400, 'MISSING_USER_IDS');
    }

    if (!title || !message) {
      return createErrorResponse('title and message are required', 400, 'MISSING_FIELDS');
    }

    await sendSiteNotification(userIds, {
      title,
      message,
      type: type || 'info',
      link,
      openInAppBrowser,
      sentBy: keyData.userId,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      recipients: userIds.length,
    });

    await logAPIUsage(keyData, '/api/v1/notifications', 'POST', 200, Date.now() - startTime, request);
    return response;
  } catch (error: any) {
    const response = createErrorResponse(error.message || 'Internal server error', 500, 'INTERNAL_ERROR');
      await logAPIUsage(keyData, '/api/v1/notifications', 'POST', 500, Date.now() - startTime, request);
      return response;
    } finally {
      cleanupRequest(ip);
    }
  } catch (error: any) {
    cleanupRequest(ip);
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

