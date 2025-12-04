/**
 * API Key Management
 * Functions for creating, managing, and revoking API keys
 */

import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { APIKey, APITier } from '@/lib/firebase/types';
import { getTierConfig, getNextQuotaResetDate } from './tiers';

/**
 * Create a new API key
 */
export async function createAPIKey(
  userId: string,
  name: string,
  scopes: string[],
  allowedUrls: string[] = [],
  tier: APITier = 'free',
  expiresAt?: Date
): Promise<{ key: string; keyData: APIKey }> {
  // Generate key via server API route (uses Node.js crypto)
  const response = await fetch('/api/admin/keys/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate API key');
  }
  
  const { key: apiKey, hashedKey } = await response.json();
  const tierConfig = getTierConfig(tier);

  const keyData: Omit<APIKey, 'id'> = {
    key: hashedKey,
    userId,
    name,
    allowedUrls,
    scopes,
    tier,
    rateLimit: tierConfig.rateLimit,
    monthlyQuota: tierConfig.monthlyQuota === Infinity ? undefined : tierConfig.monthlyQuota,
    monthlyQuotaUsed: 0,
    quotaResetDate: getNextQuotaResetDate(),
    active: true,
    createdAt: Timestamp.now() as any,
    expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) as any : undefined,
  };

  const docRef = await addDoc(collection(db, 'apiKeys'), keyData);

  return {
    key: apiKey, // Return unhashed key (only shown once)
    keyData: {
      id: docRef.id,
      ...keyData,
      createdAt: new Date(),
      expiresAt: expiresAt,
    },
  };
}

/**
 * Get all API keys for a user
 */
export async function getUserAPIKeys(userId: string): Promise<APIKey[]> {
  const q = query(
    collection(db, 'apiKeys'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : undefined,
      lastUsed: data.lastUsed?.toDate ? data.lastUsed.toDate() : undefined,
    } as APIKey;
  });
}

/**
 * Get API key by ID
 */
export async function getAPIKey(keyId: string, userId: string): Promise<APIKey | null> {
  const docRef = doc(db, 'apiKeys', keyId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  
  // Verify ownership
  if (data.userId !== userId) {
    return null;
  }

  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : undefined,
    lastUsed: data.lastUsed?.toDate ? data.lastUsed.toDate() : undefined,
  } as APIKey;
}

/**
 * Update API key
 */
export async function updateAPIKey(
  keyId: string,
  userId: string,
  updates: Partial<Pick<APIKey, 'name' | 'allowedUrls' | 'scopes' | 'active' | 'description' | 'expiresAt'>>
): Promise<void> {
  const keyData = await getAPIKey(keyId, userId);
  if (!keyData) {
    throw new Error('API key not found or access denied');
  }

  const updateData: any = {
    ...updates,
    updatedAt: Timestamp.now(),
  };

  if (updates.expiresAt) {
    updateData.expiresAt = Timestamp.fromDate(updates.expiresAt);
  }

  await updateDoc(doc(db, 'apiKeys', keyId), updateData);
}

/**
 * Revoke API key
 */
export async function revokeAPIKey(keyId: string, userId: string): Promise<void> {
  await updateAPIKey(keyId, userId, { active: false });
}

/**
 * Delete API key
 */
export async function deleteAPIKey(keyId: string, userId: string): Promise<void> {
  const keyData = await getAPIKey(keyId, userId);
  if (!keyData) {
    throw new Error('API key not found or access denied');
  }

  await deleteDoc(doc(db, 'apiKeys', keyId));
}

/**
 * Get API usage statistics
 */
export async function getAPIUsageStats(keyId: string, userId: string, days: number = 30): Promise<any> {
  const keyData = await getAPIKey(keyId, userId);
  if (!keyData) {
    throw new Error('API key not found or access denied');
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const q = query(
    collection(db, 'apiUsage'),
    where('apiKeyId', '==', keyId),
    where('timestamp', '>=', Timestamp.fromDate(since))
  );

  const snapshot = await getDocs(q);
  const usage = snapshot.docs.map((doc) => doc.data());

  return {
    totalRequests: usage.length,
    averageResponseTime: usage.reduce((sum, u) => sum + (u.responseTime || 0), 0) / usage.length || 0,
    statusCodes: usage.reduce((acc, u) => {
      acc[u.statusCode] = (acc[u.statusCode] || 0) + 1;
      return acc;
    }, {}),
    endpoints: usage.reduce((acc, u) => {
      acc[u.endpoint] = (acc[u.endpoint] || 0) + 1;
      return acc;
    }, {}),
  };
}

