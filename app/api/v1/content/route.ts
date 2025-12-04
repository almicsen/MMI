import { NextRequest, NextResponse } from 'next/server';
import { apiSecurityMiddleware, createErrorResponse, logAPIUsage, cleanupRequest } from '@/lib/api/security';
import { getClientIP } from '@/lib/api/security-enhanced';
import { getContent, getSeriesById } from '@/lib/firebase/firestore';

/**
 * Content API Endpoint
 * GET /api/v1/content - List all published content
 * GET /api/v1/content?type=series - Filter by type
 * GET /api/v1/content?seriesId=xxx - Get episodes for a series
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);
  
  try {
    // Require API key with 'read' or 'content' scope - with enhanced security
    const { keyData, error } = await apiSecurityMiddleware(request, ['read', 'content'], '/api/v1/content');
    
    if (error || !keyData) {
      cleanupRequest(ip);
      return error || createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
    }

    try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'series' | 'movie' | 'podcast' | null;
    const seriesId = searchParams.get('seriesId');

    let content;
    
    if (seriesId) {
      // Get series with episodes
      const series = await getSeriesById(seriesId);
      if (!series || !series.published) {
        return createErrorResponse('Series not found', 404, 'SERIES_NOT_FOUND');
      }
      
      const episodes = await getContent('series');
      content = {
        series,
        episodes: episodes.filter(ep => ep.seriesId === seriesId),
      };
    } else {
      content = await getContent(type || undefined);
    }

    const response = NextResponse.json({
      success: true,
      data: content,
      count: Array.isArray(content) ? content.length : 1,
    });

    await logAPIUsage(keyData, '/api/v1/content', 'GET', 200, Date.now() - startTime, request);
    return response;
  } catch (error: any) {
    const response = createErrorResponse(error.message || 'Internal server error', 500, 'INTERNAL_ERROR');
      await logAPIUsage(keyData, '/api/v1/content', 'GET', 500, Date.now() - startTime, request);
      return response;
    } finally {
      cleanupRequest(ip);
    }
  } catch (error: any) {
    cleanupRequest(ip);
    return createErrorResponse('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

