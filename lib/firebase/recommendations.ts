/**
 * Content Recommendation Algorithm
 * Analyzes analytics and ratings to provide insights:
 * - Highest rated episodes/series
 * - Shows to cancel with reasons
 * - Performance recommendations
 */

import { getAllAnalytics } from './analytics';
import { getContent, getSeries } from './firestore';
import { getContentRating } from './ratings';
import { Content, Series, ContentAnalytics } from './types';

export interface ContentRecommendation {
  contentId: string;
  title: string;
  type: 'series' | 'movie' | 'podcast';
  recommendation: 'continue' | 'cancel' | 'improve' | 'promote';
  reason: string;
  score: number; // 0-100, higher is better
  metrics: {
    views: number;
    averageRating: number;
    engagementScore: number;
    completionRate: number;
    bounceRate: number;
  };
}

export interface SeriesAnalysis {
  seriesId: string;
  seriesName: string;
  averageRating: number;
  totalViews: number;
  averageEngagement: number;
  episodeCount: number;
  recommendation: 'continue' | 'cancel' | 'improve';
  reason: string;
  topEpisodes: Array<{
    episodeId: string;
    title: string;
    rating: number;
    views: number;
  }>;
  bottomEpisodes: Array<{
    episodeId: string;
    title: string;
    rating: number;
    views: number;
  }>;
}

/**
 * Analyze all content and generate recommendations
 */
export async function analyzeContent(): Promise<ContentRecommendation[]> {
  try {
    const [allContent, allAnalytics] = await Promise.all([
      getContent(),
      getAllAnalytics('all'),
    ]);

    const recommendations: ContentRecommendation[] = [];

    for (const content of allContent) {
      const analytics = allAnalytics.find((a) => a.contentId === content.id);
      const rating = await getContentRating(content.id);

      if (!analytics) {
        // New content with no analytics
        recommendations.push({
          contentId: content.id,
          title: content.title,
          type: content.type,
          recommendation: 'promote',
          reason: 'New content - needs promotion to generate views',
          score: 50,
          metrics: {
            views: 0,
            averageRating: 0,
            engagementScore: 0,
            completionRate: 0,
            bounceRate: 0,
          },
        });
        continue;
      }

      const avgRating = rating?.averageRating || 0;
      const engagementScore = analytics.engagementScore || 0;
      const completionRate = analytics.completionRate || 0;
      const bounceRate = analytics.bounceRate || 0;
      const views = analytics.views || 0;

      // Calculate overall score (0-100)
      let score = 0;
      score += (avgRating / 5) * 30; // 30% weight on rating
      score += (engagementScore / 100) * 30; // 30% weight on engagement
      score += (completionRate / 100) * 20; // 20% weight on completion
      score += Math.max(0, (100 - bounceRate) / 100) * 10; // 10% weight on bounce (inverse)
      score += Math.min(views / 100, 1) * 10; // 10% weight on view count (capped at 100 views)

      // Determine recommendation
      let recommendation: 'continue' | 'cancel' | 'improve' | 'promote';
      let reason = '';

      if (score >= 70) {
        recommendation = 'continue';
        reason = `Strong performance: ${avgRating.toFixed(1)}⭐ rating, ${engagementScore.toFixed(1)} engagement, ${completionRate.toFixed(1)}% completion`;
      } else if (score >= 50) {
        recommendation = 'improve';
        reason = `Moderate performance: Needs improvement in ${
          avgRating < 3 ? 'ratings' : engagementScore < 50 ? 'engagement' : 'completion rate'
        }`;
      } else if (score >= 30) {
        recommendation = 'improve';
        reason = `Weak performance: Low ${avgRating < 2.5 ? 'ratings' : engagementScore < 40 ? 'engagement' : 'completion'}. Consider content improvements or promotion.`;
      } else {
        recommendation = 'cancel';
        reason = `Poor performance: ${avgRating.toFixed(1)}⭐ rating, ${engagementScore.toFixed(1)} engagement, ${bounceRate.toFixed(1)}% bounce rate. Consider discontinuing.`;
      }

      // Special cases
      if (views === 0) {
        recommendation = 'promote';
        reason = 'No views yet - needs promotion';
      } else if (views > 0 && avgRating === 0) {
        recommendation = 'improve';
        reason = 'Content has views but no ratings - encourage user feedback';
      } else if (bounceRate > 70 && views > 10) {
        recommendation = 'cancel';
        reason = `High bounce rate (${bounceRate.toFixed(1)}%) - most viewers leave early. Content may not match expectations.`;
      } else if (avgRating < 2 && views > 20) {
        recommendation = 'cancel';
        reason = `Very low rating (${avgRating.toFixed(1)}⭐) with ${views} views. Poor user reception.`;
      }

      recommendations.push({
        contentId: content.id,
        title: content.title,
        type: content.type,
        recommendation,
        reason,
        score: Math.round(score),
        metrics: {
          views,
          averageRating: avgRating,
          engagementScore,
          completionRate,
          bounceRate,
        },
      });
    }

    // Sort by score (highest first)
    return recommendations.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error analyzing content:', error);
    return [];
  }
}

/**
 * Analyze series and identify top/bottom episodes
 */
export async function analyzeSeries(): Promise<SeriesAnalysis[]> {
  try {
    const [allSeries, allContent, allAnalytics] = await Promise.all([
      getSeries(),
      getContent(),
      getAllAnalytics('all'),
    ]);

    const seriesAnalyses: SeriesAnalysis[] = [];

    for (const series of allSeries) {
      // Get all episodes for this series
      const episodes = allContent.filter((c) => c.seriesId === series.id);

      if (episodes.length === 0) continue;

      const episodeData = await Promise.all(
        episodes.map(async (episode) => {
          const analytics = allAnalytics.find((a) => a.contentId === episode.id);
          const rating = await getContentRating(episode.id);

          return {
            episodeId: episode.id,
            title: episode.title,
            rating: rating?.averageRating || 0,
            views: analytics?.views || 0,
            engagement: analytics?.engagementScore || 0,
          };
        })
      );

      // Calculate series averages
      const totalViews = episodeData.reduce((sum, e) => sum + e.views, 0);
      const avgRating =
        episodeData.filter((e) => e.rating > 0).length > 0
          ? episodeData.filter((e) => e.rating > 0).reduce((sum, e) => sum + e.rating, 0) /
            episodeData.filter((e) => e.rating > 0).length
          : 0;
      const avgEngagement =
        episodeData.length > 0
          ? episodeData.reduce((sum, e) => sum + e.engagement, 0) / episodeData.length
          : 0;

      // Sort episodes
      const sortedByRating = [...episodeData].sort((a, b) => b.rating - a.rating);
      const sortedByViews = [...episodeData].sort((a, b) => b.views - a.views);

      // Top episodes (highest rated with good views)
      const topEpisodes = sortedByRating
        .filter((e) => e.rating > 0 && e.views > 0)
        .slice(0, 3)
        .map((e) => ({
          episodeId: e.episodeId,
          title: e.title,
          rating: e.rating,
          views: e.views,
        }));

      // Bottom episodes (lowest rated or no views)
      const bottomEpisodes = sortedByRating
        .filter((e) => e.rating < 3 || e.views === 0)
        .slice(0, 3)
        .map((e) => ({
          episodeId: e.episodeId,
          title: e.title,
          rating: e.rating,
          views: e.views,
        }));

      // Determine recommendation
      let recommendation: 'continue' | 'cancel' | 'improve';
      let reason = '';

      if (avgRating >= 4 && avgEngagement >= 60 && totalViews > 50) {
        recommendation = 'continue';
        reason = `Strong series: ${avgRating.toFixed(1)}⭐ average, ${avgEngagement.toFixed(1)} engagement. Continue production.`;
      } else if (avgRating >= 3 && avgEngagement >= 40) {
        recommendation = 'improve';
        reason = `Moderate performance: ${avgRating.toFixed(1)}⭐ average. Focus on improving weaker episodes.`;
      } else if (avgRating < 2.5 && totalViews > 30) {
        recommendation = 'cancel';
        reason = `Poor ratings (${avgRating.toFixed(1)}⭐) with ${totalViews} total views. Consider cancelling series.`;
      } else if (totalViews < 10 && episodes.length > 3) {
        recommendation = 'cancel';
        reason = `Low viewership (${totalViews} views across ${episodes.length} episodes). Series not gaining traction.`;
      } else {
        recommendation = 'improve';
        reason = 'Series needs more data or improvement in content quality.';
      }

      seriesAnalyses.push({
        seriesId: series.id,
        seriesName: series.name,
        averageRating: avgRating,
        totalViews,
        averageEngagement: avgEngagement,
        episodeCount: episodes.length,
        recommendation,
        reason,
        topEpisodes,
        bottomEpisodes,
      });
    }

    // Sort by average rating
    return seriesAnalyses.sort((a, b) => b.averageRating - a.averageRating);
  } catch (error) {
    console.error('Error analyzing series:', error);
    return [];
  }
}

/**
 * Get cancellation recommendations with detailed reasons
 */
export async function getCancellationRecommendations(): Promise<ContentRecommendation[]> {
  const recommendations = await analyzeContent();
  return recommendations.filter((r) => r.recommendation === 'cancel');
}

/**
 * Get top rated content
 */
export async function getTopRatedContent(limit: number = 10): Promise<ContentRecommendation[]> {
  const recommendations = await analyzeContent();
  return recommendations
    .filter((r) => r.metrics.averageRating > 0)
    .sort((a, b) => b.metrics.averageRating - a.metrics.averageRating)
    .slice(0, limit);
}

