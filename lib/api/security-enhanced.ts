/**
 * Enhanced API Security - NASA-Level Protection
 * Comprehensive security measures for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Security configuration
const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_HEADER_SIZE = 8192; // 8KB
const REQUEST_TIMEOUT = 30000; // 30 seconds
const NONCE_EXPIRY = 300; // 5 minutes
const MAX_REQUESTS_PER_IP_PER_MINUTE = 100;

// IP blacklist/whitelist (in production, store in Firestore)
const IP_BLACKLIST = new Set<string>();
const IP_WHITELIST = new Set<string>();

// Request fingerprinting
interface RequestFingerprint {
  ip: string;
  userAgent: string;
  acceptLanguage: string;
  timestamp: number;
}

/**
 * Generate a nonce (number used once) for request signing
 */
export function generateNonce(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Create request signature using HMAC-SHA256
 */
export function createRequestSignature(
  apiKey: string,
  method: string,
  path: string,
  nonce: string,
  timestamp: number,
  body?: string
): string {
  const message = `${method}\n${path}\n${nonce}\n${timestamp}\n${body || ''}`;
  return createHmac('sha256', apiKey).update(message).digest('hex');
}

/**
 * Validate request signature
 */
export function validateRequestSignature(
  signature: string,
  apiKey: string,
  method: string,
  path: string,
  nonce: string,
  timestamp: number,
  body?: string
): boolean {
  const expectedSignature = createRequestSignature(apiKey, method, path, nonce, timestamp, body);
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Get client IP address (handles proxies)
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  return 'unknown';
}

/**
 * Create request fingerprint for anomaly detection
 */
export function createRequestFingerprint(request: NextRequest): RequestFingerprint {
  return {
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    acceptLanguage: request.headers.get('accept-language') || 'unknown',
    timestamp: Date.now(),
  };
}

/**
 * Check if IP is blacklisted
 */
export async function isIPBlacklisted(ip: string): Promise<boolean> {
  if (IP_BLACKLIST.has(ip)) return true;
  
  // Check Firestore blacklist
  try {
    const q = query(collection(db, 'ipBlacklist'), where('ip', '==', ip), where('active', '==', true));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking IP blacklist:', error);
    return false;
  }
}

/**
 * Check if IP is whitelisted (bypasses some checks)
 */
export async function isIPWhitelisted(ip: string): Promise<boolean> {
  if (IP_WHITELIST.has(ip)) return true;
  
  try {
    const q = query(collection(db, 'ipWhitelist'), where('ip', '==', ip), where('active', '==', true));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    return false;
  }
}

/**
 * Rate limit by IP address
 */
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function checkIPRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const limit = ipRateLimitMap.get(ip);
  
  if (!limit || now > limit.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + 60000 }); // 1 minute window
    return { allowed: true };
  }
  
  if (limit.count >= MAX_REQUESTS_PER_IP_PER_MINUTE) {
    const retryAfter = Math.ceil((limit.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  limit.count++;
  return { allowed: true };
}

/**
 * Validate request size
 */
export function validateRequestSize(request: NextRequest): { valid: boolean; error?: string } {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > MAX_REQUEST_SIZE) {
      return { valid: false, error: `Request too large. Maximum size: ${MAX_REQUEST_SIZE / 1024 / 1024}MB` };
    }
  }
  
  // Check header size
  let headerSize = 0;
  request.headers.forEach((value, key) => {
    headerSize += key.length + value.length;
  });
  if (headerSize > MAX_HEADER_SIZE) {
    return { valid: false, error: 'Request headers too large' };
  }
  
  return { valid: true };
}

/**
 * Sanitize and validate input
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove null bytes
    input = input.replace(/\0/g, '');
    // Limit length
    if (input.length > 10000) {
      throw new Error('Input string too long');
    }
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Validate nonce (prevent replay attacks)
 */
const usedNonces = new Map<string, number>();

export function validateNonce(nonce: string, timestamp: number): { valid: boolean; error?: string } {
  // Check if nonce was already used
  const nonceTimestamp = usedNonces.get(nonce);
  if (nonceTimestamp) {
    return { valid: false, error: 'Nonce already used (replay attack detected)' };
  }
  
  // Check timestamp freshness
  const now = Date.now() / 1000;
  const timeDiff = Math.abs(now - timestamp);
  if (timeDiff > NONCE_EXPIRY) {
    return { valid: false, error: 'Request timestamp too old or too far in future' };
  }
  
  // Store nonce (cleanup old nonces periodically)
  usedNonces.set(nonce, timestamp);
  if (usedNonces.size > 10000) {
    // Cleanup old entries
    const cutoff = now - NONCE_EXPIRY;
    for (const [n, t] of usedNonces.entries()) {
      if (t < cutoff) {
        usedNonces.delete(n);
      }
    }
  }
  
  return { valid: true };
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  type: 'blocked' | 'suspicious' | 'allowed',
  details: {
    ip: string;
    endpoint: string;
    reason?: string;
    fingerprint?: RequestFingerprint;
    apiKeyId?: string;
  }
): Promise<void> {
  try {
    await addDoc(collection(db, 'securityEvents'), {
      type,
      ...details,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}

/**
 * Enhanced security middleware
 */
export async function enhancedSecurityMiddleware(
  request: NextRequest,
  endpoint: string
): Promise<{ allowed: boolean; error?: NextResponse; fingerprint?: RequestFingerprint }> {
  const fingerprint = createRequestFingerprint(request);
  const ip = fingerprint.ip;
  
  // 1. Check IP blacklist
  if (await isIPBlacklisted(ip)) {
    await logSecurityEvent('blocked', { ip, endpoint, reason: 'IP blacklisted', fingerprint });
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'Access denied', code: 'IP_BLACKLISTED' },
        { status: 403 }
      ),
      fingerprint,
    };
  }
  
  // 2. Check IP rate limit (unless whitelisted)
  if (!(await isIPWhitelisted(ip))) {
    const ipRateLimit = await checkIPRateLimit(ip);
    if (!ipRateLimit.allowed) {
      await logSecurityEvent('blocked', {
        ip,
        endpoint,
        reason: 'IP rate limit exceeded',
        fingerprint,
      });
      return {
        allowed: false,
        error: NextResponse.json(
          {
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: ipRateLimit.retryAfter,
          },
          { status: 429, headers: { 'Retry-After': String(ipRateLimit.retryAfter) } }
        ),
        fingerprint,
      };
    }
  }
  
  // 3. Validate request size
  const sizeCheck = validateRequestSize(request);
  if (!sizeCheck.valid) {
    await logSecurityEvent('blocked', {
      ip,
      endpoint,
      reason: sizeCheck.error,
      fingerprint,
    });
    return {
      allowed: false,
      error: NextResponse.json(
        { error: sizeCheck.error, code: 'REQUEST_TOO_LARGE' },
        { status: 413 }
      ),
      fingerprint,
    };
  }
  
  // 4. Check for suspicious patterns
  const userAgent = fingerprint.userAgent.toLowerCase();
  const suspiciousPatterns = [
    'sqlmap',
    'nikto',
    'nmap',
    'masscan',
    'zap',
    'burp',
    'w3af',
    'acunetix',
  ];
  
  if (suspiciousPatterns.some(pattern => userAgent.includes(pattern))) {
    await logSecurityEvent('suspicious', {
      ip,
      endpoint,
      reason: 'Suspicious user agent detected',
      fingerprint,
    });
    // Don't block, but log for review
  }
  
  return { allowed: true, fingerprint };
}

/**
 * Validate request signature (optional enhanced security)
 */
export function validateRequestSignatureMiddleware(
  request: NextRequest,
  apiKey: string
): { valid: boolean; error?: NextResponse } {
  const signature = request.headers.get('x-signature');
  const nonce = request.headers.get('x-nonce');
  const timestamp = request.headers.get('x-timestamp');
  
  if (!signature || !nonce || !timestamp) {
    // Signature validation is optional - only enforce if headers are present
    return { valid: true };
  }
  
  const timestampNum = parseInt(timestamp, 10);
  const nonceCheck = validateNonce(nonce, timestampNum);
  if (!nonceCheck.valid) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: nonceCheck.error, code: 'INVALID_NONCE' },
        { status: 401 }
      ),
    };
  }
  
  const url = new URL(request.url);
  const body = request.body ? JSON.stringify(request.body) : undefined;
  const isValid = validateRequestSignature(
    signature,
    apiKey,
    request.method,
    url.pathname + url.search,
    nonce,
    timestampNum,
    body
  );
  
  if (!isValid) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Invalid request signature', code: 'INVALID_SIGNATURE' },
        { status: 401 }
      ),
    };
  }
  
  return { valid: true };
}

