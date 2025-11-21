'use client';

import { useEffect, useState } from 'react';
import { getAllAnalytics, getContentAnalytics } from '@/lib/firebase/analytics';
import { ContentAnalytics } from '@/lib/firebase/types';
import { getContent } from '@/lib/firebase/firestore';

type Period = '24h' | '7d' | '30d' | 'all';

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<Period>('7d');
  const [analytics, setAnalytics] = useState<ContentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [contentAnalytics, setContentAnalytics] = useState<ContentAnalytics | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const data = await getAllAnalytics(period);
        setAnalytics(data);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [period]);

  useEffect(() => {
    if (selectedContent) {
      const loadContentAnalytics = async () => {
        const data = await getContentAnalytics(selectedContent, period);
        setContentAnalytics(data);
      };
      loadContentAnalytics();
    }
  }, [selectedContent, period]);

  const totalViews = analytics.reduce((sum, item) => sum + (item.views || 0), 0);
  const totalUniqueViews = analytics.reduce((sum, item) => sum + (item.uniqueViews || 0), 0);
  const totalWatchTime = analytics.reduce((sum, item) => sum + (item.watchTime || 0), 0);
  const avgCompletionRate =
    analytics.length > 0
      ? analytics.reduce((sum, item) => sum + (item.completionRate || 0), 0) / analytics.length
      : 0;
  const avgEngagementScore =
    analytics.length > 0
      ? analytics.reduce((sum, item) => sum + (item.engagementScore || 0), 0) / analytics.length
      : 0;
  const avgBounceRate =
    analytics.length > 0
      ? analytics.reduce((sum, item) => sum + (item.bounceRate || 0), 0) / analytics.length
      : 0;

  const formatWatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Views</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Unique Views</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalUniqueViews.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Watch Time</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatWatchTime(totalWatchTime)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Avg. Completion</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgCompletionRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Engagement Score</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgEngagementScore.toFixed(1)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Out of 100</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bounce Rate</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgBounceRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Watched &lt;10%</p>
        </div>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Content ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unique
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Watch Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bounce Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {analytics.map((item) => (
                <tr key={item.contentId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.contentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.views?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item.uniqueViews?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatWatchTime(item.watchTime || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {(item.completionRate || 0).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {(item.engagementScore || 0).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {(item.bounceRate || 0).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedContent(item.contentId)}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Content Details Modal */}
      {selectedContent && contentAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Analytics: {selectedContent}
                </h3>
                <button
                  onClick={() => setSelectedContent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {contentAnalytics.views?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unique Views</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {contentAnalytics.uniqueViews?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Watch Time</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatWatchTime(contentAnalytics.watchTime || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(contentAnalytics.completionRate || 0).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average Watch Time</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatWatchTime(contentAnalytics.averageWatchTime || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Engagement Score</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {(contentAnalytics.engagementScore || 0).toFixed(1)}/100
                  </p>
                </div>
              </div>

              {/* Device Breakdown */}
              {contentAnalytics.deviceBreakdown && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Device Breakdown</h4>
                  <div className="space-y-2">
                    {Object.entries(contentAnalytics.deviceBreakdown).map(([device, count]) => (
                      <div key={device} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{device}</span>
                        <div className="flex items-center gap-2 flex-1 mx-4">
                          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{
                                width: `${(Number(count) / totalViews) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                            {Number(count).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Peak Viewing Hours */}
              {contentAnalytics.peakViewingHours && Object.keys(contentAnalytics.peakViewingHours).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Peak Viewing Hours</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 24 }).map((_, hour) => {
                      const count = contentAnalytics.peakViewingHours[hour.toString()] || 0;
                      const maxCount = Math.max(...Object.values(contentAnalytics.peakViewingHours));
                      return (
                        <div key={hour} className="text-center">
                          <div
                            className="w-full bg-blue-600 rounded-t mb-1"
                            style={{ height: `${maxCount > 0 ? (count / maxCount) * 100 : 0}px`, minHeight: '4px' }}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{hour}:00</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Retention Curve */}
              {contentAnalytics.retentionCurve && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Retention Curve</h4>
                  <div className="space-y-2">
                    {Object.entries(contentAnalytics.retentionCurve)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([point, count]) => {
                        const percentage = totalViews > 0 ? ((count as number) / totalViews) * 100 : 0;
                        return (
                          <div key={point} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{point}%</span>
                            <div className="flex items-center gap-2 flex-1 mx-4">
                              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-600"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Views Over Time Chart */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Views Over Time</h4>
                <div className="space-y-2">
                  {Object.entries(contentAnalytics.viewsByPeriod || {})
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, count]) => (
                      <div key={date} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{date}</span>
                        <div className="flex items-center gap-2 flex-1 mx-4">
                          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{
                                width: `${(Number(count) / (contentAnalytics.views || 1)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
                            {Number(count).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

