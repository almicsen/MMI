/**
 * Analytics tracking for MMI+ content
 * Tracks views, watch time, and engagement metrics
 */

import { collection, addDoc, doc, getDoc, getDocs, query, where, Timestamp, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from './config';
import { ViewEvent, ContentAnalytics } from './types';

/**
 * Track a view event with detailed Nielsen-like metrics
 */
export async function trackView(
  contentId: string,
  userId: string | null,
  duration: number,
  completed: boolean,
  additionalData?: {
    watchSegments?: Array<{ start: number; end: number }>;
    pauses?: number;
    seeks?: number;
    playbackSpeed?: number;
    referrer?: string;
  }
): Promise<void> {
  try {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Detect device type more accurately
    let deviceType = 'desktop';
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) {
        deviceType = 'mobile';
      } else if (width < 1024) {
        deviceType = 'tablet';
      } else {
        deviceType = 'desktop';
      }
    }

    // Create detailed view event
    await addDoc(collection(db, 'viewEvents'), {
      contentId,
      userId: userId || null,
      timestamp: Timestamp.now(),
      duration,
      completed,
      deviceType,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      referrer: additionalData?.referrer || (typeof document !== 'undefined' ? document.referrer : ''),
      watchSegments: additionalData?.watchSegments || [],
      pauses: additionalData?.pauses || 0,
      seeks: additionalData?.seeks || 0,
      playbackSpeed: additionalData?.playbackSpeed || 1.0,
    });

    // Update analytics
    const analyticsRef = doc(db, 'contentAnalytics', contentId);
    const analyticsDoc = await getDoc(analyticsRef);

    const today = new Date().toISOString().split('T')[0];
    const analyticsDocData = analyticsDoc.exists() ? analyticsDoc.data() : {};
    
    // Calculate detailed metrics
    const totalViews = (analyticsDocData.views || 0) + 1;
    const totalWatchTime = (analyticsDocData.watchTime || 0) + duration;
    const averageWatchTime = totalWatchTime / totalViews;
    
    // Calculate engagement score (0-100)
    const completionWeight = completed ? 1 : 0.5;
    const durationWeight = Math.min(duration / 300, 1); // Normalize to 5 minutes
    const engagementScore = ((analyticsDocData.engagementScore || 0) * (totalViews - 1) + (completionWeight * 50 + durationWeight * 50)) / totalViews;
    
    // Calculate bounce rate (watched < 10% of content)
    const contentDuration = analyticsDocData.contentDuration || 0;
    const isBounce = contentDuration > 0 && (duration / contentDuration) < 0.1;
    const bounceCount = (analyticsDocData.bounceCount || 0) + (isBounce ? 1 : 0);
    const bounceRate = (bounceCount / totalViews) * 100;
    
    // Retention curve points (simplified - would need more data for full curve)
    const retentionPoints = analyticsDocData.retentionCurve || { '0': 100, '25': 0, '50': 0, '75': 0, '100': 0 };
    if (contentDuration > 0) {
      const progressPercent = Math.floor((duration / contentDuration) * 100);
      if (progressPercent >= 25 && progressPercent < 50) retentionPoints['25'] = (retentionPoints['25'] || 0) + 1;
      if (progressPercent >= 50 && progressPercent < 75) retentionPoints['50'] = (retentionPoints['50'] || 0) + 1;
      if (progressPercent >= 75 && progressPercent < 100) retentionPoints['75'] = (retentionPoints['75'] || 0) + 1;
      if (progressPercent >= 100) retentionPoints['100'] = (retentionPoints['100'] || 0) + 1;
    }
    
    const updates: any = {
      views: increment(1),
      watchTime: increment(duration),
      averageWatchTime,
      engagementScore,
      bounceRate,
      bounceCount: isBounce ? increment(1) : analyticsDocData.bounceCount || 0,
      retentionCurve: retentionPoints,
      updatedAt: Timestamp.now(),
      [`viewsByPeriod.${today}`]: increment(1),
      [`peakViewingHours.${hour}`]: increment(1),
      [`peakViewingDays.${dayNames[dayOfWeek]}`]: increment(1),
      [`deviceBreakdown.${deviceType}`]: increment(1),
    };

    if (userId) {
      // Check if this is a unique view
      const existingViews = query(
        collection(db, 'viewEvents'),
        where('contentId', '==', contentId),
        where('userId', '==', userId)
      );
      const existingViewsSnapshot = await getDocs(existingViews);
      
      if (existingViewsSnapshot.empty) {
        updates.uniqueViews = increment(1);
      }
    }

    if (completed) {
      // Update completion rate
      const currentAnalytics = analyticsDoc.data();
      const totalViews = (currentAnalytics?.views || 0) + 1;
      const totalCompletions = (currentAnalytics?.completions || 0) + 1;
      updates.completionRate = (totalCompletions / totalViews) * 100;
      updates.completions = increment(1);
    }

    if (analyticsDoc.exists()) {
      await updateDoc(analyticsRef, updates);
    } else {
      await setDoc(analyticsRef, {
        contentId,
        views: 1,
        uniqueViews: userId ? 1 : 0,
        watchTime: duration,
        averageWatchTime: duration,
        completionRate: completed ? 100 : 0,
        completions: completed ? 1 : 0,
        engagementScore: engagementScore,
        bounceRate: bounceRate,
        bounceCount: isBounce ? 1 : 0,
        viewsByPeriod: { [today]: 1 },
        peakViewingHours: { [hour]: 1 },
        peakViewingDays: { [dayNames[dayOfWeek]]: 1 },
        deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0, tv: 0, [deviceType]: 1 },
        retentionCurve: retentionPoints,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error tracking view:', error);
  }
}

/**
 * Get analytics for a content item
 */
export async function getContentAnalytics(
  contentId: string,
  period: '24h' | '7d' | '30d' | 'all' = 'all'
): Promise<ContentAnalytics | null> {
  try {
    const analyticsRef = doc(db, 'contentAnalytics', contentId);
    const analyticsDoc = await getDoc(analyticsRef);

    if (!analyticsDoc.exists()) {
      return null;
    }

    const data = analyticsDoc.data() as ContentAnalytics;

    // Filter by period if needed
    if (period !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (period) {
        case '24h':
          cutoffDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
      }

      const filteredViews: { [key: string]: number } = {};
      Object.entries(data.viewsByPeriod || {}).forEach(([date, count]) => {
        const viewDate = new Date(date);
        if (viewDate >= cutoffDate) {
          filteredViews[date] = count;
        }
      });

      return {
        ...data,
        viewsByPeriod: filteredViews,
      };
    }

    return data;
  } catch (error) {
    console.error('Error getting analytics:', error);
    return null;
  }
}

/**
 * Get all analytics (for admin dashboard)
 */
export async function getAllAnalytics(period: '24h' | '7d' | '30d' | 'all' = 'all'): Promise<ContentAnalytics[]> {
  try {
    const snapshot = await getDocs(collection(db, 'contentAnalytics'));
    const analytics = snapshot.docs.map((doc) => ({
      contentId: doc.id,
      ...doc.data(),
    } as ContentAnalytics));

    if (period === 'all') {
      return analytics;
    }

    // Filter by period
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (period) {
      case '24h':
        cutoffDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
    }

    return analytics.map((item) => {
      const filteredViews: { [key: string]: number } = {};
      Object.entries(item.viewsByPeriod || {}).forEach(([date, count]) => {
        const viewDate = new Date(date);
        if (viewDate >= cutoffDate) {
          filteredViews[date] = count;
        }
      });

      return {
        ...item,
        viewsByPeriod: filteredViews,
      };
    });
  } catch (error) {
    console.error('Error getting all analytics:', error);
    return [];
  }
}

