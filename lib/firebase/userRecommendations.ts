/**
 * User Recommendation Engine
 * Provides personalized content recommendations based on viewing history, likes, favorites, and ratings
 */

import { getUserData } from './auth';
import { getContent, getContentById } from './firestore';
import { getContentRating } from './ratings';
import { getAllAnalytics } from './analytics';
import { Content, User } from './types';

export interface Recommendation {
  content: Content;
  score: number;
  reason: string;
}

/**
 * Get personalized recommendations for a user
 */
export async function getUserRecommendations(userId: string, limit: number = 10): Promise<Recommendation[]> {
  try {
    const [user, allContent, allRatings, allAnalytics] = await Promise.all([
      getUserData(userId),
      getContent(),
      Promise.all((await getContent()).map(async (c) => ({ id: c.id, rating: await getContentRating(c.id) }))),
      getAllAnalytics('all'),
    ]);

    const recommendations: Recommendation[] = [];
    const userLikes = user.likes || [];
    const userFavorites = user.favorites || [];
    const userWatchlist = user.watchlist || [];
    const userProgress = user.progress || {};

    // Get content user has watched
    const watchedContentIds = Object.keys(userProgress);
    const completedContentIds = Object.keys(userProgress).filter(
      (id) => userProgress[id].completed
    );

    for (const content of allContent) {
      // Skip if user has already completed it
      if (completedContentIds.includes(content.id)) continue;

      let score = 0;
      const reasons: string[] = [];

      // 1. Series continuation (30% weight)
      if (content.seriesId) {
        const seriesEpisodes = allContent.filter((c) => c.seriesId === content.seriesId);
        const watchedEpisodes = seriesEpisodes.filter((e) => watchedContentIds.includes(e.id));
        if (watchedEpisodes.length > 0) {
          const progress = watchedEpisodes.length / seriesEpisodes.length;
          score += progress * 30;
          reasons.push(`Continue watching ${content.seriesId}`);
        }
      }

      // 2. Similar content based on type (20% weight)
      const userWatchedTypes = watchedContentIds
        .map((id) => allContent.find((c) => c.id === id)?.type)
        .filter(Boolean);
      const typeCount = userWatchedTypes.filter((t) => t === content.type).length;
      if (typeCount > 0) {
        score += Math.min((typeCount / userWatchedTypes.length) * 20, 20);
        reasons.push(`Similar to your ${content.type} preferences`);
      }

      // 3. High ratings (20% weight)
      const rating = allRatings.find((r) => r.id === content.id)?.rating;
      if (rating && rating.averageRating >= 4) {
        score += (rating.averageRating / 5) * 20;
        reasons.push(`Highly rated (${rating.averageRating.toFixed(1)}⭐)`);
      }

      // 4. Popular content (15% weight)
      const analytics = allAnalytics.find((a) => a.contentId === content.id);
      if (analytics && analytics.views > 10) {
        const popularityScore = Math.min(analytics.views / 100, 1) * 15;
        score += popularityScore;
        reasons.push('Popular with other viewers');
      }

      // 5. In watchlist (10% weight)
      if (userWatchlist.includes(content.id)) {
        score += 10;
        reasons.push('In your watchlist');
      }

      // 6. Similar to favorites (5% weight)
      if (userFavorites.length > 0) {
        const favoriteTypes = userFavorites
          .map((id) => allContent.find((c) => c.id === id)?.type)
          .filter(Boolean);
        if (favoriteTypes.includes(content.type)) {
          score += 5;
          reasons.push('Similar to your favorites');
        }
      }

      // 7. New content boost (5% weight)
      if (content.createdAt) {
        const daysSinceCreation = (Date.now() - new Date(content.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 7) {
          score += 5;
          reasons.push('Recently added');
        }
      }

      if (score > 0) {
        recommendations.push({
          content,
          score: Math.round(score),
          reason: reasons.slice(0, 2).join(', '), // Top 2 reasons
        });
      }
    }

    // Sort by score and return top recommendations
    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

/**
 * Get next episode in series
 */
export async function getNextEpisode(currentContent: Content): Promise<Content | null> {
  if (!currentContent.seriesId || !currentContent.episodeNumber) return null;

  try {
    const allContent = await getContent();
    const seriesEpisodes = allContent
      .filter((c) => c.seriesId === currentContent.seriesId)
      .sort((a, b) => {
        // Sort by season, then episode
        if (a.seasonNumber !== b.seasonNumber) {
          return (a.seasonNumber || 0) - (b.seasonNumber || 0);
        }
        return (a.episodeNumber || 0) - (b.episodeNumber || 0);
      });

    const currentIndex = seriesEpisodes.findIndex((e) => e.id === currentContent.id);
    if (currentIndex >= 0 && currentIndex < seriesEpisodes.length - 1) {
      return seriesEpisodes[currentIndex + 1];
    }

    return null;
  } catch (error) {
    console.error('Error getting next episode:', error);
    return null;
  }
}

/**
 * Get top recommendations (not personalized)
 */
export async function getTopRecommendations(limit: number = 10): Promise<Recommendation[]> {
  try {
    const [allContent, allRatings, allAnalytics] = await Promise.all([
      getContent(),
      Promise.all((await getContent()).map(async (c) => ({ id: c.id, rating: await getContentRating(c.id) }))),
      getAllAnalytics('all'),
    ]);

    const recommendations: Recommendation[] = [];

    for (const content of allContent) {
      const rating = allRatings.find((r) => r.id === content.id)?.rating;
      const analytics = allAnalytics.find((a) => a.contentId === content.id);

      let score = 0;
      const reasons: string[] = [];

      // Rating score (50%)
      if (rating && rating.averageRating > 0) {
        score += (rating.averageRating / 5) * 50;
        reasons.push(`${rating.averageRating.toFixed(1)}⭐ rating`);
      }

      // Popularity score (30%)
      if (analytics && analytics.views > 0) {
        const popularityScore = Math.min(analytics.views / 100, 1) * 30;
        score += popularityScore;
        reasons.push(`${analytics.views} views`);
      }

      // Engagement score (20%)
      if (analytics && analytics.engagementScore > 0) {
        score += (analytics.engagementScore / 100) * 20;
        reasons.push(`High engagement`);
      }

      if (score > 0) {
        recommendations.push({
          content,
          score: Math.round(score),
          reason: reasons.join(', '),
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error('Error getting top recommendations:', error);
    return [];
  }
}

