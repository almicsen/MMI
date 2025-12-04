/**
 * Server-Side API Security Utilities
 * These functions use Node.js crypto and must only be used on the server
 */

import { createHash, randomBytes } from 'crypto';

/**
 * Generate a new API key
 */
export function generateAPIKey(): string {
  const randomPart = randomBytes(32).toString('hex');
  const timestamp = Date.now().toString(36);
  return `mmi_${timestamp}_${randomPart}`;
}

/**
 * Hash an API key for storage
 */
export function hashAPIKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key against a hash
 */
export function verifyAPIKey(key: string, hash: string): boolean {
  const keyHash = hashAPIKey(key);
  return keyHash === hash;
}

