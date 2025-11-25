/**
 * API Security Middleware
 * Handles API key validation, CORS, rate limiting, and origin checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
// Note: crypto functions moved to security-server.ts to avoid client-side bundling
import { checkRateLimit, checkMonthlyQuota, incrementQuotaUsage } from './rateLimiting';
import { APIKey } from '@/lib/firebase/types';
import { 
  enhancedSecurityMiddleware, 
  getClientIP, 
  validateRequestSize,
  sanitizeInput,
  logSecurityEvent 
} from './security-enhanced';
import { 
  ddosProtectionMiddleware,
  trackRequest 
} from './ddos-protection';
import {
  comprehensiveRequestValidation,
  releaseConcurrentRequest,
  withTimeout,
  checkMemoryUsage,
} from './security-hardening';
import { hashAPIKey as hashAPIKeyServer } from './security-server';

/**
 * Cleanup function to call after request processing
 */
export function cleanupRequest(ip: string): void {
  releaseConcurrentRequest(ip);
}

export interface APIKeyData {
  id: string;
  userId: string;
  name: string;
  allowedUrls: string[];
  scopes: string[];
  tier?: 'free' | 'starter' | 'business' | 'enterprise';
  rateLimit?: {
    requests: number;
    period: number;
  };
  monthlyQuota?: number;
  monthlyQuotaUsed?: number;
  quotaResetDate?: Date;
  active: boolean;
  manualOverrides?: {
    additionalRequests?: number;
    overrideExpiresAt?: Date;
    customRateLimit?: {
      requests: number;
      period: number;
    };
    overrideExpiresAtRateLimit?: Date;
  };
}

/**
 * Hash API key for storage (server-side only)
 * Re-exported from security-server.ts
 */
export { hashAPIKeyServer as hashAPIKey };
export { generateAPIKey } from './security-server';

/**
 * Validate API key and return key data
 */
export async function validateAPIKey(apiKey: string): Promise<APIKeyData | null> {
  try {
    const hashedKey = hashAPIKeyServer(apiKey);
    const q = query(
      collection(db, 'apiKeys'),
      where('key', '==', hashedKey),
      where('active', '==', true)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    // Check expiration
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      return null;
    }

    // Update last used
    await updateDoc(doc.ref, {
      lastUsed: Timestamp.now(),
    });

    return {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      allowedUrls: data.allowedUrls || [],
      scopes: data.scopes || [],
      tier: data.tier || 'free',
      rateLimit: data.rateLimit,
      monthlyQuota: data.monthlyQuota,
      monthlyQuotaUsed: data.monthlyQuotaUsed || 0,
      quotaResetDate: data.quotaResetDate?.toDate ? data.quotaResetDate.toDate() : data.quotaResetDate,
      active: data.active,
      manualOverrides: data.manualOverrides,
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(
  origin: string | null,
  allowedUrls: string[],
  referer: string | null
): boolean {
  if (!origin && !referer) {
    return false; // Must have origin or referer
  }

  const checkUrl = origin || referer || '';
  
  // Check if URL is in allowed list
  for (const allowedUrl of allowedUrls) {
    try {
      const allowed = new URL(allowedUrl);
      const check = new URL(checkUrl);
      
      // Match protocol, hostname, and port
      if (
        allowed.protocol === check.protocol &&
        allowed.hostname === check.hostname &&
        allowed.port === check.port
      ) {
        return true;
      }
      
      // Also check if it's a subdomain match
      if (check.hostname.endsWith(`.${allowed.hostname}`)) {
        return true;
      }
    } catch (e) {
      // Invalid URL format, skip
      continue;
    }
  }

  return false;
}

/**
 * Get origin from request
 */
export function getOrigin(request: NextRequest): string | null {
  return request.headers.get('origin') || request.headers.get('referer');
}

/**
 * Check if request has required scope
 */
export function hasScope(keyData: APIKeyData, requiredScope: string): boolean {
  return keyData.scopes.includes(requiredScope) || keyData.scopes.includes('*');
}

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  status: number = 403,
  code: string = 'API_ERROR'
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: code,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * API Security Middleware - Enhanced with NASA-level security
 */
export async function apiSecurityMiddleware(
  request: NextRequest,
  requiredScopes: string[] = [],
  endpoint: string = '/api/v1'
): Promise<{ keyData: APIKeyData | null; error: NextResponse | null }> {
  const ip = getClientIP(request);
  
  // 1. Comprehensive request validation (headers, query, path, etc.)
  const validation = await comprehensiveRequestValidation(request);
  if (!validation.valid) {
    return {
      keyData: null,
      error: validation.error || createErrorResponse('Invalid request', 400, 'INVALID_REQUEST'),
    };
  }
  
  // 2. Check memory usage
  const memoryCheck = checkMemoryUsage();
  if (!memoryCheck.ok) {
    await logSecurityEvent('blocked', {
      ip,
      endpoint,
      reason: 'Server memory limit exceeded',
    });
    return {
      keyData: null,
      error: createErrorResponse('Service temporarily unavailable', 503, 'SERVICE_UNAVAILABLE'),
    };
  }
  
  // 3. DDoS protection (connection limits, pattern detection, circuit breaker)
  const ddosCheck = await ddosProtectionMiddleware(request, endpoint);
  if (!ddosCheck.allowed) {
    return {
      keyData: null,
      error: ddosCheck.error || createErrorResponse('DDoS protection triggered', 429, 'DDOS_PROTECTION'),
    };
  }
  
  // 4. Enhanced security checks (IP blacklist, rate limits, etc.)
  const enhancedSecurity = await enhancedSecurityMiddleware(request, endpoint);
  if (!enhancedSecurity.allowed) {
    return {
      keyData: null,
      error: enhancedSecurity.error || createErrorResponse('Access denied', 403, 'ACCESS_DENIED'),
    };
  }
  
  // Track request for DDoS pattern analysis
  trackRequest(ip);
  
  // Get API key from header
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    await logSecurityEvent('blocked', {
      ip: getClientIP(request),
      endpoint,
      reason: 'Missing API key',
      fingerprint: enhancedSecurity.fingerprint,
    });
    return {
      keyData: null,
      error: createErrorResponse('API key is required', 401, 'MISSING_API_KEY'),
    };
  }

  // Validate API key
  const keyData = await validateAPIKey(apiKey);
  if (!keyData) {
    return {
      keyData: null,
      error: createErrorResponse('Invalid or expired API key', 401, 'INVALID_API_KEY'),
    };
  }

  // Check origin (unless URL is in allowed list)
  const origin = getOrigin(request);
  if (keyData.allowedUrls.length === 0) {
    // If no allowed URLs, must be from the site itself
    const siteOrigin = request.nextUrl.origin;
    if (origin && !origin.startsWith(siteOrigin)) {
      return {
        keyData: null,
        error: createErrorResponse('Origin not allowed', 403, 'ORIGIN_NOT_ALLOWED'),
      };
    }
  } else {
    // Check if origin is in allowed list
    if (!isOriginAllowed(origin, keyData.allowedUrls, request.headers.get('referer'))) {
      return {
        keyData: null,
        error: createErrorResponse('Origin not in allowed list', 403, 'ORIGIN_NOT_ALLOWED'),
      };
    }
  }

  // Check scopes
  if (requiredScopes.length > 0) {
    const hasRequiredScope = requiredScopes.some(scope => hasScope(keyData, scope));
    if (!hasRequiredScope) {
      return {
        keyData: null,
        error: createErrorResponse('Insufficient permissions', 403, 'INSUFFICIENT_SCOPES'),
      };
    }
  }

  // Check rate limiting
  const rateLimitResult = await checkRateLimit(
    keyData.id,
    keyData.tier || 'free',
    keyData.manualOverrides?.customRateLimit
  );
  if (!rateLimitResult.allowed) {
    return {
      keyData: null,
      error: createErrorResponse(
        `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter}s`,
        429,
        'RATE_LIMIT_EXCEEDED'
      ),
    };
  }

  // Check monthly quota (get full API key doc for quota info)
  try {
    const keyDoc = await getDoc(doc(db, 'apiKeys', keyData.id));
    if (keyDoc.exists()) {
      const keyDataFull = { id: keyDoc.id, ...keyDoc.data() } as APIKey;
      const quotaResult = await checkMonthlyQuota(keyDataFull);
      if (!quotaResult.allowed) {
        await logSecurityEvent('blocked', {
          ip: getClientIP(request),
          endpoint,
          reason: 'Monthly quota exceeded',
          fingerprint: enhancedSecurity.fingerprint,
          apiKeyId: keyData.id,
        });
        return {
          keyData: null,
          error: createErrorResponse('Monthly quota exceeded', 429, 'QUOTA_EXCEEDED'),
        };
      }
    }
  } catch (error) {
    console.error('Error checking quota:', error);
    // Don't block request if quota check fails
  }

  return { keyData, error: null };
}

/**
 * Log API usage
 */
export async function logAPIUsage(
  keyData: APIKeyData,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  request: NextRequest
): Promise<void> {
  try {
    // Log usage
    await addDoc(collection(db, 'apiUsage'), {
      apiKeyId: keyData.id,
      endpoint,
      method,
      statusCode,
      responseTime,
      timestamp: Timestamp.now(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      tier: keyData.tier || 'free',
    });
    
    // Increment quota usage (only for successful requests)
    if (statusCode >= 200 && statusCode < 300) {
      await incrementQuotaUsage(keyData.id);
    }
  } catch (error) {
    console.error('Error logging API usage:', error);
    // Don't throw - logging failures shouldn't break the API
  }
}

