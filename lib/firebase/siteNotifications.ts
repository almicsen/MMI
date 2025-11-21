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
  const notifications = userIds.map((userId) => ({
    userId,
    title: notification.title,
    message: notification.message,
    type: notification.type || 'info',
    link: notification.link,
    read: false,
    createdAt: Timestamp.now(),
    sentBy: notification.sentBy,
  }));

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
  const q = query(
    collection(db, 'siteNotifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        readAt: data.readAt?.toDate ? data.readAt.toDate() : undefined,
      } as SiteNotification;
    });
    callback(notifications);
  });
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

