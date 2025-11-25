/**
 * API Tier Configuration
 * Defines limits and features for each pricing tier
 */

import { APITier } from '@/lib/firebase/types';

export interface TierConfig {
  name: string;
  monthlyQuota: number; // Monthly API request limit
  rateLimit: {
    requests: number; // Requests per period
    period: number; // Period in seconds
  };
  features: {
    content: boolean;
    notifications: boolean;
    notificationsLimit?: number; // Monthly notification limit
    users: boolean;
    analytics: 'none' | 'basic' | 'advanced';
    support: string;
    customRateLimits: boolean;
    selfHosting: boolean;
  };
  price: number; // Monthly price in USD
}

export const TIER_CONFIGS: Record<APITier, TierConfig> = {
  free: {
    name: 'Developer',
    monthlyQuota: 10_000,
    rateLimit: {
      requests: 100,
      period: 3600, // 1 hour
    },
    features: {
      content: true,
      notifications: false,
      users: false,
      analytics: 'none',
      support: 'Community',
      customRateLimits: false,
      selfHosting: false,
    },
    price: 0,
  },
  starter: {
    name: 'Professional',
    monthlyQuota: 100_000,
    rateLimit: {
      requests: 1_000,
      period: 3600, // 1 hour
    },
    features: {
      content: true,
      notifications: true,
      notificationsLimit: 10_000,
      users: true,
      analytics: 'basic',
      support: 'Email (48hr)',
      customRateLimits: false,
      selfHosting: false,
    },
    price: 99,
  },
  business: {
    name: 'Enterprise Ready',
    monthlyQuota: 1_000_000,
    rateLimit: {
      requests: 10_000,
      period: 3600, // 1 hour
    },
    features: {
      content: true,
      notifications: true, // Unlimited
      users: true,
      analytics: 'advanced',
      support: 'Email + Slack (24hr)',
      customRateLimits: true,
      selfHosting: false,
    },
    price: 499,
  },
  enterprise: {
    name: 'Custom',
    monthlyQuota: Infinity, // Unlimited with fair use
    rateLimit: {
      requests: 100_000, // High default, can be customized
      period: 3600,
    },
    features: {
      content: true,
      notifications: true, // Unlimited
      users: true,
      analytics: 'advanced',
      support: 'Dedicated (4hr)',
      customRateLimits: true,
      selfHosting: true,
    },
    price: 2499,
  },
};

/**
 * Get tier configuration
 */
export function getTierConfig(tier: APITier): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Check if tier has access to a feature
 */
export function hasFeatureAccess(tier: APITier, feature: keyof TierConfig['features']): boolean {
  const config = TIER_CONFIGS[tier];
  return config.features[feature] === true;
}

/**
 * Get monthly quota for tier
 */
export function getMonthlyQuota(tier: APITier): number {
  return TIER_CONFIGS[tier].monthlyQuota;
}

/**
 * Get rate limit for tier
 */
export function getRateLimit(tier: APITier): { requests: number; period: number } {
  return TIER_CONFIGS[tier].rateLimit;
}

/**
 * Get quota reset date for next month
 */
export function getNextQuotaResetDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);
  return nextMonth;
}

