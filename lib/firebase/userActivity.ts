/**
 * User Activity Tracking
 * Tracks when users are online, what device they're using, and current page
 */

import { doc, updateDoc, onSnapshot, collection, query, where, Timestamp, getDocs } from 'firebase/firestore';
import { db } from './config';
import { UserActivity } from './types';

export type { UserActivity };

/**
 * Update user's activity (called periodically when user is on site)
 */
export async function updateUserActivity(
  userId: string,
  data: {
    isOnline?: boolean;
    currentPage?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    userAgent?: string;
  }
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    lastSeen: Timestamp.now(),
    isOnline: data.isOnline ?? true,
    currentPage: data.currentPage,
    deviceType: data.deviceType,
    userAgent: data.userAgent,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Mark user as offline
 */
export async function markUserOffline(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    isOnline: false,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get all active users (online in last 5 minutes)
 */
export async function getActiveUsers(): Promise<UserActivity[]> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const q = query(
    collection(db, 'users'),
    where('isOnline', '==', true)
  );

  const snapshot = await getDocs(q);
  const activeUsers: UserActivity[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const lastSeen = data.lastSeen?.toDate ? data.lastSeen.toDate() : null;

    // Only include if seen in last 5 minutes
    if (lastSeen && lastSeen >= fiveMinutesAgo) {
      activeUsers.push({
        uid: docSnap.id,
        email: data.email || '',
        displayName: data.displayName,
        photoURL: data.photoURL,
        role: data.role || 'guest',
        isOnline: true,
        lastSeen: lastSeen,
        currentPage: data.currentPage,
        deviceType: data.deviceType,
        userAgent: data.userAgent,
        sessionStart: data.sessionStart?.toDate ? data.sessionStart.toDate() : undefined,
      });
    }
  });

  return activeUsers.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
}

/**
 * Subscribe to active users (real-time updates)
 */
export function subscribeToActiveUsers(
  callback: (users: UserActivity[]) => void
): () => void {
  const q = query(
    collection(db, 'users'),
    where('isOnline', '==', true)
  );

  return onSnapshot(q, (snapshot) => {
    const activeUsers: UserActivity[] = [];
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const lastSeen = data.lastSeen?.toDate ? data.lastSeen.toDate() : null;

      // Only include if seen in last 5 minutes
      if (lastSeen && lastSeen.getTime() >= fiveMinutesAgo) {
        activeUsers.push({
          uid: docSnap.id,
          email: data.email || '',
          displayName: data.displayName,
          role: data.role || 'guest',
          isOnline: true,
          lastSeen: lastSeen,
          currentPage: data.currentPage,
          deviceType: data.deviceType,
          userAgent: data.userAgent,
          sessionStart: data.sessionStart?.toDate ? data.sessionStart.toDate() : undefined,
        });
      }
    });

    callback(activeUsers.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime()));
  });
}

/**
 * Detect device type from user agent or window size
 */
export function detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

