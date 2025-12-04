'use client';

import { useEffect, useState } from 'react';
import {
  analyzeContent,
  analyzeSeries,
  getCancellationRecommendations,
  getTopRatedContent,
  ContentRecommendation,
  SeriesAnalysis,
} from '@/lib/firebase/recommendations';

export default function RecommendationsPanel() {
  const [contentRecs, setContentRecs] = useState<ContentRecommendation[]>([]);
  const [seriesRecs, setSeriesRecs] = useState<SeriesAnalysis[]>([]);
  const [cancellations, setCancellations] = useState<ContentRecommendation[]>([]);
  const [topRated, setTopRated] = useState<ContentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cancellations' | 'top-rated' | 'series'>('overview');

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const [content, series, cancel, top] = await Promise.all([
          analyzeContent(),
          analyzeSeries(),
          getCancellationRecommendations(),
          getTopRatedContent(10),
        ]);
        setContentRecs(content);
        setSeriesRecs(series);
        setCancellations(cancel);
        setTopRated(top);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRecommendations();
  }, []);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'continue':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'cancel':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'improve':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'promote':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Analyzing content...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Recommendations</h2>
        <div className="flex gap-2">
          {(['overview', 'cancellations', 'top-rated', 'series'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {tab === 'top-rated' ? 'Top Rated' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Cancellation Candidates</h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">{cancellations.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Shows recommended for cancellation</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Top Rated</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{topRated.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Highest performing content</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Total Content</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{contentRecs.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Items analyzed</p>
          </div>
        </div>
      )}

      {activeTab === 'cancellations' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Cancellation Recommendations</h3>
          {cancellations.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No cancellation recommendations at this time.</p>
          ) : (
            cancellations.map((rec) => (
              <div key={rec.contentId} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{rec.type}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRecommendationColor(rec.recommendation)}`}>
                    Score: {rec.score}/100
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">{rec.reason}</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Views</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{rec.metrics.views}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Rating</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {rec.metrics.averageRating.toFixed(1)}⭐
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Engagement</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {rec.metrics.engagementScore.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Completion</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {rec.metrics.completionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Bounce</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {rec.metrics.bounceRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'top-rated' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Top Rated Content</h3>
          {topRated.map((rec, index) => (
            <div key={rec.contentId} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-gray-400 dark:text-gray-600">#{index + 1}</span>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{rec.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-500">{rec.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-500">
                    {rec.metrics.averageRating.toFixed(1)}⭐
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">Score: {rec.score}/100</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Views</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{rec.metrics.views}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Engagement</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {rec.metrics.engagementScore.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Completion</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {rec.metrics.completionRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Bounce</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {rec.metrics.bounceRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'series' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Series Analysis</h3>
          {seriesRecs.map((series) => (
            <div key={series.seriesId} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{series.seriesName}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {series.episodeCount} episodes • {series.totalViews} total views
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRecommendationColor(series.recommendation)}`}>
                  {series.recommendation.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{series.reason}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold mb-2 text-gray-900 dark:text-white">Top Episodes</h5>
                  <div className="space-y-2">
                    {series.topEpisodes.length > 0 ? (
                      series.topEpisodes.map((ep) => (
                        <div key={ep.episodeId} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{ep.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500">{ep.rating.toFixed(1)}⭐</span>
                            <span className="text-xs text-gray-500">{ep.views} views</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No rated episodes yet</p>
                    )}
                  </div>
                </div>
                <div>
                  <h5 className="font-semibold mb-2 text-gray-900 dark:text-white">Bottom Episodes</h5>
                  <div className="space-y-2">
                    {series.bottomEpisodes.length > 0 ? (
                      series.bottomEpisodes.map((ep) => (
                        <div key={ep.episodeId} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{ep.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500">{ep.rating > 0 ? `${ep.rating.toFixed(1)}⭐` : 'No rating'}</span>
                            <span className="text-xs text-gray-500">{ep.views} views</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No problematic episodes</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

