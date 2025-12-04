/**
 * Site Notifications (In-App Notifications)
 * Notifications that appear on the site for users
 */

import { collection, addDoc, doc, getDocs, updateDoc, query, where, orderBy, limit, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import { SiteNotification } from './types';

export type { SiteNotification };

/**
 * Send a site notification to one or more users
 */
export async function sendSiteNotification(
  userIds: string[],
  notification: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    sentBy?: string;
  }
): Promise<void> {
  const notifications = userIds.map((userId) => {
    // Build notification object, filtering out undefined values
    const notifData: any = {
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info',
      read: false,
      createdAt: Timestamp.now(),
    };

    // Only include link if it's provided and not empty
    if (notification.link && notification.link.trim() !== '') {
      notifData.link = notification.link;
    }

    // Only include sentBy if it's provided
    if (notification.sentBy) {
      notifData.sentBy = notification.sentBy;
    }

    return notifData;
  });

  // Create notifications for all users
  const promises = notifications.map((notif) => addDoc(collection(db, 'siteNotifications'), notif));
  await Promise.all(promises);
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limitCount: number = 50): Promise<SiteNotification[]> {
  const q = query(
    collection(db, 'siteNotifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      readAt: data.readAt?.toDate ? data.readAt.toDate() : undefined,
    } as SiteNotification;
  });
}

/**
 * Subscribe to user notifications (real-time)
 */
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: SiteNotification[]) => void
): () => void {
  if (!userId) {
    console.warn('subscribeToUserNotifications called without userId');
    callback([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, 'siteNotifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    let lastNotifications: SiteNotification[] = [];

    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const notifications = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              readAt: data.readAt?.toDate ? data.readAt.toDate() : undefined,
            } as SiteNotification;
          });

          // Only call callback if notifications actually changed (prevent infinite loops)
          const notificationsChanged = 
            notifications.length !== lastNotifications.length ||
            notifications.some((n, i) => 
              !lastNotifications[i] || 
              n.id !== lastNotifications[i].id || 
              n.read !== lastNotifications[i].read
            );

          if (notificationsChanged) {
            lastNotifications = notifications;
            callback(notifications);
          }
        } catch (error) {
          console.error('Error processing notification snapshot:', error);
          callback([]);
        }
      },
      (error) => {
        console.error('Error in notification subscription:', error);
        // If it's a permission error or index error, just return empty array
        if (error.code === 'permission-denied' || error.code === 'failed-precondition') {
          console.warn('Firestore index required. Create index at:', error.message);
          callback([]);
        }
      }
    );
  } catch (error) {
    console.error('Error setting up notification subscription:', error);
    // Return a no-op unsubscribe function
    return () => {};
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'siteNotifications', notificationId), {
    read: true,
    readAt: Timestamp.now(),
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'siteNotifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map((docSnap) =>
    updateDoc(docSnap.ref, {
      read: true,
      readAt: Timestamp.now(),
    })
  );

  await Promise.all(promises);
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const q = query(
    collection(db, 'siteNotifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
}

