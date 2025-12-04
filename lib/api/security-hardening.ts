/**
 * NASA-Level Security Hardening
 * Additional security measures beyond basic protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, logSecurityEvent } from './security-enhanced';

// Security Configuration
const SECURITY_CONFIG = {
  // Request timeout
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // Memory limits
  MAX_MEMORY_USAGE: 512 * 1024 * 1024, // 512MB
  
  // CPU throttling
  MAX_CPU_TIME_PER_REQUEST: 5000, // 5 seconds
  
  // Geographic restrictions (optional)
  ALLOWED_COUNTRIES: [] as string[], // Empty = allow all
  BLOCKED_COUNTRIES: [] as string[],
  
  // Advanced rate limiting
  BURST_LIMIT: 20, // Requests in 1 second
  SUSTAINED_LIMIT: 100, // Requests per minute
  
  // Request validation
  MAX_HEADERS: 50,
  MAX_HEADER_NAME_LENGTH: 256,
  MAX_HEADER_VALUE_LENGTH: 4096,
  MAX_QUERY_PARAMS: 100,
  MAX_QUERY_STRING_LENGTH: 2048,
  
  // Content validation
  MAX_JSON_DEPTH: 20,
  MAX_JSON_KEYS: 1000,
  
  // Connection limits
  MAX_CONCURRENT_REQUESTS_PER_IP: 10,
  MAX_TOTAL_CONCURRENT_REQUESTS: 1000,
};

// Track concurrent requests per IP
const concurrentRequests = new Map<string, number>();
let totalConcurrentRequests = 0;

/**
 * Validate request headers
 */
export function validateHeaders(request: NextRequest): { valid: boolean; error?: string } {
  let headerCount = 0;
  
  request.headers.forEach((value, key) => {
    headerCount++;
    
    if (headerCount > SECURITY_CONFIG.MAX_HEADERS) {
      return { valid: false, error: 'Too many headers' };
    }
    
    if (key.length > SECURITY_CONFIG.MAX_HEADER_NAME_LENGTH) {
      return { valid: false, error: 'Header name too long' };
    }
    
    if (value.length > SECURITY_CONFIG.MAX_HEADER_VALUE_LENGTH) {
      return { valid: false, error: 'Header value too long' };
    }
    
    // Block dangerous headers
    const dangerousHeaders = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url'];
    if (dangerousHeaders.includes(key.toLowerCase())) {
      return { valid: false, error: 'Dangerous header detected' };
    }
  });
  
  return { valid: true };
}

/**
 * Validate query parameters
 */
export function validateQueryParams(request: NextRequest): { valid: boolean; error?: string } {
  const params = request.nextUrl.searchParams;
  
  if (params.size > SECURITY_CONFIG.MAX_QUERY_PARAMS) {
    return { valid: false, error: 'Too many query parameters' };
  }
  
  const queryString = request.nextUrl.search;
  if (queryString.length > SECURITY_CONFIG.MAX_QUERY_STRING_LENGTH) {
    return { valid: false, error: 'Query string too long' };
  }
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(UNION.*SELECT)/i,
    /(OR\s+1\s*=\s*1)/i,
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(queryString)) {
      return { valid: false, error: 'Suspicious query parameter detected' };
    }
  }
  
  return { valid: true };
}

/**
 * Validate JSON structure
 */
export function validateJSONStructure(obj: any, depth: number = 0, keyCount: number = 0): { valid: boolean; error?: string } {
  if (depth > SECURITY_CONFIG.MAX_JSON_DEPTH) {
    return { valid: false, error: 'JSON structure too deep' };
  }
  
  if (keyCount > SECURITY_CONFIG.MAX_JSON_KEYS) {
    return { valid: false, error: 'Too many JSON keys' };
  }
  
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = validateJSONStructure(item, depth + 1, keyCount);
        if (!result.valid) return result;
      }
    } else {
      for (const [key, value] of Object.entries(obj)) {
        keyCount++;
        if (keyCount > SECURITY_CONFIG.MAX_JSON_KEYS) {
          return { valid: false, error: 'Too many JSON keys' };
        }
        
        const result = validateJSONStructure(value, depth + 1, keyCount);
        if (!result.valid) return result;
      }
    }
  }
  
  return { valid: true };
}

/**
 * Check concurrent request limits
 */
export function checkConcurrentRequests(ip: string): { allowed: boolean; error?: string } {
  // Check total concurrent requests
  if (totalConcurrentRequests >= SECURITY_CONFIG.MAX_TOTAL_CONCURRENT_REQUESTS) {
    return { allowed: false, error: 'Server at capacity. Please try again later.' };
  }
  
  // Check per-IP concurrent requests
  const ipConcurrent = concurrentRequests.get(ip) || 0;
  if (ipConcurrent >= SECURITY_CONFIG.MAX_CONCURRENT_REQUESTS_PER_IP) {
    return { allowed: false, error: 'Too many concurrent requests from this IP' };
  }
  
  // Increment counters
  concurrentRequests.set(ip, ipConcurrent + 1);
  totalConcurrentRequests++;
  
  return { allowed: true };
}

/**
 * Release concurrent request
 */
export function releaseConcurrentRequest(ip: string): void {
  const current = concurrentRequests.get(ip) || 0;
  if (current > 0) {
    concurrentRequests.set(ip, current - 1);
  } else {
    concurrentRequests.delete(ip);
  }
  
  if (totalConcurrentRequests > 0) {
    totalConcurrentRequests--;
  }
}

/**
 * Detect and block bot traffic
 */
export function detectBotTraffic(request: NextRequest): { isBot: boolean; confidence: number } {
  const userAgent = request.headers.get('user-agent') || '';
  const ua = userAgent.toLowerCase();
  
  // Known bot patterns
  const botPatterns = [
    /bot|crawler|spider|scraper/i,
    /curl|wget|python|java|go-http/i,
    /^$/, // Empty user agent
  ];
  
  // Legitimate bots (allow)
  const legitimateBots = [
    /googlebot|bingbot|slurp|duckduckbot/i,
    /facebookexternalhit|twitterbot|linkedinbot/i,
  ];
  
  // Check if legitimate bot
  for (const pattern of legitimateBots) {
    if (pattern.test(ua)) {
      return { isBot: true, confidence: 0.1 }; // Low confidence, allow
    }
  }
  
  // Check if suspicious bot
  for (const pattern of botPatterns) {
    if (pattern.test(ua)) {
      // Additional checks
      const hasAcceptHeader = request.headers.get('accept');
      const hasAcceptLanguage = request.headers.get('accept-language');
      const hasReferer = request.headers.get('referer');
      
      let confidence = 0.5;
      if (!hasAcceptHeader) confidence += 0.2;
      if (!hasAcceptLanguage) confidence += 0.2;
      if (!hasReferer) confidence += 0.1;
      
      return { isBot: true, confidence: Math.min(confidence, 1.0) };
    }
  }
  
  return { isBot: false, confidence: 0 };
}

/**
 * Validate request method
 */
export function validateRequestMethod(method: string): { valid: boolean; error?: string } {
  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  
  if (!allowedMethods.includes(method.toUpperCase())) {
    return { valid: false, error: `Method ${method} not allowed` };
  }
  
  return { valid: true };
}

/**
 * Check for path traversal attacks
 */
export function detectPathTraversal(path: string): boolean {
  const dangerousPatterns = [
    /\.\./, // Directory traversal
    /\/\.\./, // Directory traversal
    /\.\.\//, // Directory traversal
    /%2e%2e/, // URL encoded
    /%2f/, // URL encoded slash
    /\.\.%2f/, // URL encoded traversal
    /\0/, // Null byte
    /\/\//, // Double slash
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(path));
}

/**
 * Check for XSS patterns in request
 */
export function detectXSSPatterns(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /expression\(/i, // CSS expression
    /vbscript:/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Comprehensive request validation
 */
export async function comprehensiveRequestValidation(
  request: NextRequest
): Promise<{ valid: boolean; error?: NextResponse }> {
  const ip = getClientIP(request);
  
  // 1. Validate method
  const methodCheck = validateRequestMethod(request.method);
  if (!methodCheck.valid) {
    await logSecurityEvent('blocked', {
      ip,
      endpoint: request.nextUrl.pathname,
      reason: methodCheck.error,
    });
    return {
      valid: false,
      error: NextResponse.json(
        { error: methodCheck.error, code: 'INVALID_METHOD' },
        { status: 405 }
      ),
    };
  }
  
  // 2. Validate headers
  const headerCheck = validateHeaders(request);
  if (!headerCheck.valid) {
    await logSecurityEvent('blocked', {
      ip,
      endpoint: request.nextUrl.pathname,
      reason: headerCheck.error,
    });
    return {
      valid: false,
      error: NextResponse.json(
        { error: headerCheck.error, code: 'INVALID_HEADERS' },
        { status: 400 }
      ),
    };
  }
  
  // 3. Validate query parameters
  const queryCheck = validateQueryParams(request);
  if (!queryCheck.valid) {
    await logSecurityEvent('blocked', {
      ip,
      endpoint: request.nextUrl.pathname,
      reason: queryCheck.error,
    });
    return {
      valid: false,
      error: NextResponse.json(
        { error: queryCheck.error, code: 'INVALID_QUERY' },
        { status: 400 }
      ),
    };
  }
  
  // 4. Check path traversal
  if (detectPathTraversal(request.nextUrl.pathname)) {
    await logSecurityEvent('blocked', {
      ip,
      endpoint: request.nextUrl.pathname,
      reason: 'Path traversal attack detected',
    });
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Invalid path', code: 'PATH_TRAVERSAL' },
        { status: 400 }
      ),
    };
  }
  
  // 5. Check concurrent requests
  const concurrentCheck = checkConcurrentRequests(ip);
  if (!concurrentCheck.allowed) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: concurrentCheck.error, code: 'CONCURRENT_LIMIT' },
        { status: 503 }
      ),
    };
  }
  
  // 6. Detect bot traffic (log but don't block by default)
  const botCheck = detectBotTraffic(request);
  if (botCheck.isBot && botCheck.confidence > 0.8) {
    await logSecurityEvent('suspicious', {
      ip,
      endpoint: request.nextUrl.pathname,
      reason: `High-confidence bot detected: ${botCheck.confidence}`,
    });
    // Don't block, but log for analysis
  }
  
  return { valid: true };
}

/**
 * Request timeout wrapper
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = SECURITY_CONFIG.REQUEST_TIMEOUT
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

/**
 * Memory usage monitoring
 */
export function checkMemoryUsage(): { ok: boolean; usage?: number } {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    const total = usage.heapTotal + usage.external;
    
    if (total > SECURITY_CONFIG.MAX_MEMORY_USAGE) {
      return { ok: false, usage: total };
    }
    
    return { ok: true, usage: total };
  }
  
  return { ok: true };
}

/**
 * Health check endpoint data
 */
export function getHealthCheckData(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  memory: { used: number; limit: number; ok: boolean };
  concurrent: { current: number; limit: number; ok: boolean };
  timestamp: string;
} {
  const memory = checkMemoryUsage();
  const concurrent = {
    current: totalConcurrentRequests,
    limit: SECURITY_CONFIG.MAX_TOTAL_CONCURRENT_REQUESTS,
    ok: totalConcurrentRequests < SECURITY_CONFIG.MAX_TOTAL_CONCURRENT_REQUESTS * 0.9,
  };
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (!memory.ok || !concurrent.ok) {
    status = 'degraded';
  }
  if (totalConcurrentRequests >= SECURITY_CONFIG.MAX_TOTAL_CONCURRENT_REQUESTS) {
    status = 'unhealthy';
  }
  
  return {
    status,
    memory: {
      used: memory.usage || 0,
      limit: SECURITY_CONFIG.MAX_MEMORY_USAGE,
      ok: memory.ok,
    },
    concurrent,
    timestamp: new Date().toISOString(),
  };
}

