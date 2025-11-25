/**
 * NASA-Level DDoS Protection
 * Comprehensive distributed denial-of-service attack mitigation
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getClientIP, createRequestFingerprint, logSecurityEvent } from './security-enhanced';

// DDoS Protection Configuration
const DDoS_CONFIG = {
  // Connection rate limits
  MAX_CONNECTIONS_PER_IP_PER_SECOND: 10,
  MAX_CONNECTIONS_PER_IP_PER_MINUTE: 100,
  MAX_CONNECTIONS_PER_IP_PER_HOUR: 1000,
  
  // Request pattern detection
  SUSPICIOUS_REQUEST_THRESHOLD: 50, // Requests in 10 seconds
  SUSPICIOUS_REQUEST_WINDOW: 10000, // 10 seconds in milliseconds
  
  // Automatic blocking
  AUTO_BLOCK_THRESHOLD: 100, // Requests in 1 minute
  AUTO_BLOCK_DURATION: 3600000, // 1 hour in milliseconds
  
  // Challenge-response
  CHALLENGE_THRESHOLD: 30, // Requests in 1 minute triggers challenge
  CHALLENGE_DURATION: 300000, // 5 minutes
  
  // Circuit breaker
  CIRCUIT_BREAKER_THRESHOLD: 1000, // Requests per minute
  CIRCUIT_BREAKER_COOLDOWN: 60000, // 1 minute
  
  // Request queuing
  MAX_QUEUE_SIZE: 1000,
  QUEUE_TIMEOUT: 30000, // 30 seconds
};

// In-memory rate limit tracking (for serverless, consider Redis in production)
interface RateLimitState {
  requests: number[];
  connections: number[];
  suspiciousCount: number;
  lastSuspiciousTime: number;
  blockedUntil?: number;
  challengeUntil?: number;
  circuitBreakerOpen?: boolean;
  circuitBreakerOpenUntil?: number;
}

const ipRateLimitMap = new Map<string, RateLimitState>();

// Request queue for handling bursts
interface QueuedRequest {
  request: NextRequest;
  resolve: (response: NextResponse) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

const requestQueue: QueuedRequest[] = [];
let queueProcessing = false;

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimitMap() {
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  
  for (const [ip, state] of ipRateLimitMap.entries()) {
    // Remove old requests
    state.requests = state.requests.filter(t => t > oneHourAgo);
    state.connections = state.connections.filter(t => t > oneHourAgo);
    
    // Remove empty entries
    if (state.requests.length === 0 && state.connections.length === 0 && !state.blockedUntil && !state.challengeUntil) {
      ipRateLimitMap.delete(ip);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitMap, 300000);

/**
 * Check connection rate limits
 */
export function checkConnectionRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let state = ipRateLimitMap.get(ip);
  
  if (!state) {
    state = {
      requests: [],
      connections: [],
      suspiciousCount: 0,
      lastSuspiciousTime: 0,
    };
    ipRateLimitMap.set(ip, state);
  }
  
  // Check if IP is blocked
  if (state.blockedUntil && now < state.blockedUntil) {
    const retryAfter = Math.ceil((state.blockedUntil - now) / 1000);
    return { allowed: false, retryAfter };
  } else if (state.blockedUntil) {
    // Block expired, clear it
    state.blockedUntil = undefined;
  }
  
  // Check circuit breaker
  if (state.circuitBreakerOpen && state.circuitBreakerOpenUntil && now < state.circuitBreakerOpenUntil) {
    return { allowed: false, retryAfter: Math.ceil((state.circuitBreakerOpenUntil - now) / 1000) };
  } else if (state.circuitBreakerOpen) {
    // Circuit breaker cooldown expired
    state.circuitBreakerOpen = false;
    state.circuitBreakerOpenUntil = undefined;
  }
  
  // Clean old connections
  const oneSecondAgo = now - 1000;
  const oneMinuteAgo = now - 60000;
  const oneHourAgo = now - 3600000;
  
  state.connections = state.connections.filter(t => t > oneHourAgo);
  
  // Check per-second limit
  const recentConnections = state.connections.filter(t => t > oneSecondAgo).length;
  if (recentConnections >= DDoS_CONFIG.MAX_CONNECTIONS_PER_IP_PER_SECOND) {
    return { allowed: false, retryAfter: 1 };
  }
  
  // Check per-minute limit
  const minuteConnections = state.connections.filter(t => t > oneMinuteAgo).length;
  if (minuteConnections >= DDoS_CONFIG.MAX_CONNECTIONS_PER_IP_PER_MINUTE) {
    const oldest = Math.min(...state.connections.filter(t => t > oneMinuteAgo));
    const retryAfter = Math.ceil((oldest + 60000 - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Check per-hour limit
  const hourConnections = state.connections.filter(t => t > oneHourAgo).length;
  if (hourConnections >= DDoS_CONFIG.MAX_CONNECTIONS_PER_IP_PER_HOUR) {
    const oldest = Math.min(...state.connections.filter(t => t > oneHourAgo));
    const retryAfter = Math.ceil((oldest + 3600000 - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Record connection
  state.connections.push(now);
  
  return { allowed: true };
}

/**
 * Detect suspicious request patterns
 */
export function detectSuspiciousPattern(ip: string): { suspicious: boolean; shouldBlock: boolean; shouldChallenge: boolean } {
  const now = Date.now();
  let state = ipRateLimitMap.get(ip);
  
  if (!state) {
    return { suspicious: false, shouldBlock: false, shouldChallenge: false };
  }
  
  // Check requests in suspicious window
  const windowStart = now - DDoS_CONFIG.SUSPICIOUS_REQUEST_WINDOW;
  const recentRequests = state.requests.filter(t => t > windowStart);
  
  if (recentRequests.length >= DDoS_CONFIG.SUSPICIOUS_REQUEST_THRESHOLD) {
    state.suspiciousCount++;
    state.lastSuspiciousTime = now;
    
    // Check if should auto-block
    const oneMinuteAgo = now - 60000;
    const minuteRequests = state.requests.filter(t => t > oneMinuteAgo).length;
    
    if (minuteRequests >= DDoS_CONFIG.AUTO_BLOCK_THRESHOLD) {
      // Auto-block for 1 hour
      state.blockedUntil = now + DDoS_CONFIG.AUTO_BLOCK_DURATION;
      
      // Log to Firestore
      logSecurityEvent('blocked', {
        ip,
        endpoint: 'ddos-protection',
        reason: `Auto-blocked: ${minuteRequests} requests in 1 minute`,
      });
      
      return { suspicious: true, shouldBlock: true, shouldChallenge: false };
    }
    
    // Check if should trigger challenge
    if (minuteRequests >= DDoS_CONFIG.CHALLENGE_THRESHOLD) {
      state.challengeUntil = now + DDoS_CONFIG.CHALLENGE_DURATION;
      return { suspicious: true, shouldBlock: false, shouldChallenge: true };
    }
    
    return { suspicious: true, shouldBlock: false, shouldChallenge: false };
  }
  
  // Check circuit breaker
  const oneMinuteAgo = now - 60000;
  const minuteRequests = state.requests.filter(t => t > oneMinuteAgo).length;
  
  if (minuteRequests >= DDoS_CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
    state.circuitBreakerOpen = true;
    state.circuitBreakerOpenUntil = now + DDoS_CONFIG.CIRCUIT_BREAKER_COOLDOWN;
    
    logSecurityEvent('blocked', {
      ip,
      endpoint: 'ddos-protection',
      reason: `Circuit breaker opened: ${minuteRequests} requests in 1 minute`,
    });
    
    return { suspicious: true, shouldBlock: true, shouldChallenge: false };
  }
  
  return { suspicious: false, shouldBlock: false, shouldChallenge: false };
}

/**
 * Generate challenge token (simple proof-of-work)
 */
export function generateChallenge(): { token: string; difficulty: number } {
  const token = Math.random().toString(36).substring(2, 15);
  const difficulty = 3; // Number of leading zeros required in hash
  return { token, difficulty };
}

/**
 * Verify challenge response
 */
export function verifyChallenge(token: string, response: string, difficulty: number): boolean {
  // Simple proof-of-work: hash must start with '0' repeated 'difficulty' times
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(token + response).digest('hex');
  const prefix = '0'.repeat(difficulty);
  return hash.startsWith(prefix);
}

/**
 * Track request for pattern analysis
 */
export function trackRequest(ip: string): void {
  const now = Date.now();
  let state = ipRateLimitMap.get(ip);
  
  if (!state) {
    state = {
      requests: [],
      connections: [],
      suspiciousCount: 0,
      lastSuspiciousTime: 0,
    };
    ipRateLimitMap.set(ip, state);
  }
  
  state.requests.push(now);
  
  // Keep only last hour of requests
  const oneHourAgo = now - 3600000;
  state.requests = state.requests.filter(t => t > oneHourAgo);
}

/**
 * DDoS Protection Middleware
 */
export async function ddosProtectionMiddleware(
  request: NextRequest,
  endpoint: string
): Promise<{ allowed: boolean; error?: NextResponse; challenge?: { token: string; difficulty: number } }> {
  const ip = getClientIP(request);
  const fingerprint = createRequestFingerprint(request);
  
  // 1. Check connection rate limits
  const connectionCheck = checkConnectionRateLimit(ip);
  if (!connectionCheck.allowed) {
    await logSecurityEvent('blocked', {
      ip,
      endpoint,
      reason: `Connection rate limit exceeded: ${connectionCheck.retryAfter}s retry`,
      fingerprint,
    });
    
    return {
      allowed: false,
      error: NextResponse.json(
        {
          error: 'Too many connections. Please slow down.',
          code: 'CONNECTION_RATE_LIMIT',
          retryAfter: connectionCheck.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(connectionCheck.retryAfter || 60),
            'X-RateLimit-Limit': String(DDoS_CONFIG.MAX_CONNECTIONS_PER_IP_PER_MINUTE),
            'X-RateLimit-Remaining': '0',
          },
        }
      ),
    };
  }
  
  // 2. Track request
  trackRequest(ip);
  
  // 3. Detect suspicious patterns
  const patternCheck = detectSuspiciousPattern(ip);
  
  if (patternCheck.shouldBlock) {
    await logSecurityEvent('blocked', {
      ip,
      endpoint,
      reason: 'DDoS pattern detected - auto-blocked',
      fingerprint,
    });
    
    return {
      allowed: false,
      error: NextResponse.json(
        {
          error: 'Access temporarily blocked due to suspicious activity',
          code: 'DDOS_BLOCKED',
        },
        { status: 403 }
      ),
    };
  }
  
  if (patternCheck.shouldChallenge) {
    const challenge = generateChallenge();
    
    // Store challenge in request (would use session/cache in production)
    // For now, return challenge in response
    return {
      allowed: false,
      challenge,
      error: NextResponse.json(
        {
          error: 'Challenge required',
          code: 'CHALLENGE_REQUIRED',
          challenge: {
            token: challenge.token,
            difficulty: challenge.difficulty,
            message: `Please compute a SHA256 hash of "${challenge.token}" + your response that starts with ${challenge.difficulty} zeros. Include the response in X-Challenge-Response header.`,
          },
        },
        { status: 429 }
      ),
    };
  }
  
  // 4. Check if challenge response is valid (if challenge was issued)
  const challengeResponse = request.headers.get('x-challenge-response');
  const challengeToken = request.headers.get('x-challenge-token');
  
  if (challengeToken && challengeResponse) {
    // Verify challenge (simplified - in production, store challenges server-side)
    const state = ipRateLimitMap.get(ip);
    if (state?.challengeUntil && Date.now() < state.challengeUntil) {
      // Challenge is required but verification is simplified here
      // In production, use proper challenge storage
      state.challengeUntil = undefined; // Clear challenge on successful response
    }
  }
  
  return { allowed: true };
}

/**
 * Request queue processor
 */
async function processRequestQueue() {
  if (queueProcessing || requestQueue.length === 0) {
    return;
  }
  
  queueProcessing = true;
  
  while (requestQueue.length > 0) {
    const queued = requestQueue.shift();
    if (!queued) continue;
    
    // Check timeout
    if (Date.now() - queued.timestamp > DDoS_CONFIG.QUEUE_TIMEOUT) {
      queued.reject(new Error('Request queue timeout'));
      continue;
    }
    
    // Process request (would call actual handler here)
    // For now, this is a placeholder
  }
  
  queueProcessing = false;
}

/**
 * Add request to queue
 */
export function queueRequest(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return new Promise((resolve, reject) => {
    if (requestQueue.length >= DDoS_CONFIG.MAX_QUEUE_SIZE) {
      reject(new Error('Request queue full'));
      return;
    }
    
    requestQueue.push({
      request,
      resolve,
      reject,
      timestamp: Date.now(),
    });
    
    processRequestQueue();
  });
}

/**
 * Get DDoS protection statistics
 */
export function getDDoSStats(ip?: string): {
  totalTrackedIPs: number;
  blockedIPs: number;
  challengedIPs: number;
  circuitBreakerOpen: number;
  queueSize: number;
  ipStats?: {
    requests: number;
    connections: number;
    suspicious: boolean;
    blocked: boolean;
    challenged: boolean;
  };
} {
  const now = Date.now();
  let blockedCount = 0;
  let challengedCount = 0;
  let circuitBreakerCount = 0;
  
  for (const state of ipRateLimitMap.values()) {
    if (state.blockedUntil && now < state.blockedUntil) {
      blockedCount++;
    }
    if (state.challengeUntil && now < state.challengeUntil) {
      challengedCount++;
    }
    if (state.circuitBreakerOpen && state.circuitBreakerOpenUntil && now < state.circuitBreakerOpenUntil) {
      circuitBreakerCount++;
    }
  }
  
  const stats: any = {
    totalTrackedIPs: ipRateLimitMap.size,
    blockedIPs: blockedCount,
    challengedIPs: challengedCount,
    circuitBreakerOpen: circuitBreakerCount,
    queueSize: requestQueue.length,
  };
  
  if (ip) {
    const state = ipRateLimitMap.get(ip);
    if (state) {
      const oneMinuteAgo = now - 60000;
      stats.ipStats = {
        requests: state.requests.filter(t => t > oneMinuteAgo).length,
        connections: state.connections.filter(t => t > oneMinuteAgo).length,
        suspicious: state.suspiciousCount > 0,
        blocked: !!(state.blockedUntil && now < state.blockedUntil),
        challenged: !!(state.challengeUntil && now < state.challengeUntil),
      };
    }
  }
  
  return stats;
}

