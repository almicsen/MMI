/**
 * Rate Limiting and Quota Management
 * Handles tier-based rate limiting and monthly quota tracking
 */

import { collection, doc, getDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { APIKey, APITier } from '@/lib/firebase/types';
import { getTierConfig, getRateLimit, getMonthlyQuota } from './tiers';

interface RateLimitState {
  requests: number[];
  period: number;
}

// In-memory rate limit tracking (for serverless, consider Redis in production)
const rateLimitCache = new Map<string, RateLimitState>();

/**
 * Check if request is within rate limit
 */
export async function checkRateLimit(
  apiKeyId: string,
  tier: APITier,
  customRateLimit?: { requests: number; period: number }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const config = customRateLimit || getRateLimit(tier);
  const cacheKey = `rate:${apiKeyId}`;
  
  const now = Date.now();
  const windowStart = now - config.period * 1000;
  
  let state = rateLimitCache.get(cacheKey);
  
  if (!state || state.period !== config.period) {
    state = {
      requests: [],
      period: config.period,
    };
    rateLimitCache.set(cacheKey, state);
  }
  
  // Remove old requests outside the window
  state.requests = state.requests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  if (state.requests.length >= config.requests) {
    const oldestRequest = state.requests[0];
    const retryAfter = Math.ceil((oldestRequest + config.period * 1000 - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Add current request
  state.requests.push(now);
  rateLimitCache.set(cacheKey, state);
  
  return { allowed: true };
}

/**
 * Check if monthly quota is available
 */
export async function checkMonthlyQuota(apiKey: APIKey): Promise<{ allowed: boolean; remaining?: number }> {
  const tier = apiKey.tier || 'free';
  const config = getTierConfig(tier);
  
  // Get current quota (accounting for manual overrides)
  let quota = config.monthlyQuota;
  if (apiKey.manualOverrides?.additionalRequests) {
    quota += apiKey.manualOverrides.additionalRequests;
  }
  
  // Check if override expired
  if (apiKey.manualOverrides?.overrideExpiresAt) {
    if (new Date(apiKey.manualOverrides.overrideExpiresAt) < new Date()) {
      // Override expired, reset it
      await updateDoc(doc(db, 'apiKeys', apiKey.id!), {
        'manualOverrides.additionalRequests': null,
        'manualOverrides.overrideExpiresAt': null,
      });
      quota = config.monthlyQuota;
    }
  }
  
  // Check if quota reset needed
  const now = new Date();
  let quotaResetDate: Date;
  if (!apiKey.quotaResetDate) {
    quotaResetDate = new Date(0);
  } else if (apiKey.quotaResetDate instanceof Date) {
    quotaResetDate = apiKey.quotaResetDate;
  } else if (typeof apiKey.quotaResetDate === 'object' && 'toDate' in apiKey.quotaResetDate) {
    quotaResetDate = (apiKey.quotaResetDate as any).toDate();
  } else {
    quotaResetDate = new Date(apiKey.quotaResetDate);
  }
  
  if (!quotaResetDate || quotaResetDate < now) {
    // Reset quota for new month
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    
    await updateDoc(doc(db, 'apiKeys', apiKey.id!), {
      monthlyQuotaUsed: 0,
      quotaResetDate: Timestamp.fromDate(nextMonth),
    });
    
    return { allowed: true, remaining: quota };
  }
  
  // Check current usage
  const used = apiKey.monthlyQuotaUsed || 0;
  const remaining = quota - used;
  
  if (remaining <= 0) {
    return { allowed: false, remaining: 0 };
  }
  
  return { allowed: true, remaining };
}

/**
 * Increment monthly quota usage
 */
export async function incrementQuotaUsage(apiKeyId: string): Promise<void> {
  try {
    const keyDoc = await getDoc(doc(db, 'apiKeys', apiKeyId));
    if (!keyDoc.exists()) return;
    
    const currentUsed = keyDoc.data().monthlyQuotaUsed || 0;
    await updateDoc(doc(db, 'apiKeys', apiKeyId), {
      monthlyQuotaUsed: currentUsed + 1,
    });
  } catch (error) {
    console.error('Error incrementing quota usage:', error);
    // Don't throw - quota tracking shouldn't break API
  }
}


