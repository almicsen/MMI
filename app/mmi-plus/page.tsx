'use client';

import { useEffect, useState } from 'react';
import InstantLink from '@/components/InstantLink';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import ComingSoonCard from '@/components/mmip/ComingSoonCard';
import UpcomingEpisodesModal from '@/components/mmip/UpcomingEpisodesModal';
import SeriesCard from '@/components/mmip/SeriesCard';
import RatingDisplay from '@/components/RatingDisplay';
import { getContent, getSeries, getComingSoon } from '@/lib/firebase/firestore';
import { getContentRating } from '@/lib/firebase/ratings';
import { Content, Series, ComingSoonContent } from '@/lib/firebase/types';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';

export default function MMIPlus() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('mmiPlus');

  // If page is disabled, the hook will redirect, so we don't need to render anything
  if (pageCheckLoading || !enabled) {
    return <LoadingState />;
  }
  const [activeTab, setActiveTab] = useState<'all' | 'series' | 'movies' | 'podcasts' | 'coming-soon'>('all');
  const [content, setContent] = useState<Content[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [comingSoon, setComingSoon] = useState<ComingSoonContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState<ComingSoonContent | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [contentData, seriesData, comingSoonData] = await Promise.all([
          getContent(),
          getSeries(),
          getComingSoon(),
        ]);
        setContent(contentData);
        setSeries(seriesData);
        setComingSoon(comingSoonData);
      } catch (err) {
        console.error('Error loading content:', err);
        setError(err instanceof Error ? err : new Error('Failed to load content'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Group content by series for podcasts and series
  const groupedBySeries = (() => {
    const grouped: { [seriesId: string]: { series: Series; episodes: Content[] } } = {};
    
    // Get all series
    series.forEach((s) => {
      if (s.episodes && s.episodes.length > 0) {
        grouped[s.id] = { series: s, episodes: [] };
      }
    });
    
    // Group content by seriesId
    content.forEach((item) => {
      if (item.seriesId && grouped[item.seriesId]) {
        // Check if it matches the current tab and search
        const matchesTab =
          activeTab === 'all' ||
          (activeTab === 'series' && item.type === 'series') ||
          (activeTab === 'podcasts' && item.type === 'podcast');
        
        const matchesSearch =
          searchQuery === '' ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          grouped[item.seriesId].series.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (matchesTab && matchesSearch) {
          grouped[item.seriesId].episodes.push(item);
        }
      }
    });
    
    return grouped;
  })();

  // Get standalone content (movies, or episodes without series)
  const standaloneContent = content.filter((item) => {
    if (activeTab === 'coming-soon') return false;
    
    // Skip items that belong to a series (they'll be shown in SeriesCard)
    if (item.seriesId) return false;
    
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'series' && item.type === 'series') ||
      (activeTab === 'movies' && item.type === 'movie') ||
      (activeTab === 'podcasts' && item.type === 'podcast');
    
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // Filter series to only show those with matching episodes
  const visibleSeries = Object.values(groupedBySeries).filter(
    (group) => group.episodes.length > 0
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">MMI+</h1>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {(['all', 'series', 'movies', 'podcasts', 'coming-soon'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {tab === 'coming-soon' ? 'Coming Soon' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState skeleton count={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => window.location.reload()} />
      ) : activeTab === 'coming-soon' ? (
        comingSoon.length === 0 ? (
          <EmptyState message="No upcoming content at this time." icon="📅" />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoon.map((item) => (
                <ComingSoonCard
                  key={item.id}
                  content={item}
                  onViewEpisodes={setSelectedContent}
                />
              ))}
            </div>
            <UpcomingEpisodesModal
              content={selectedContent}
              onClose={() => setSelectedContent(null)}
            />
          </>
        )
      ) : visibleSeries.length === 0 && standaloneContent.length === 0 ? (
        <EmptyState message="No content available." />
      ) : (
        <div className="space-y-6">
          {/* Series/Podcasts grouped by series */}
          {visibleSeries.length > 0 && (
            <div className="space-y-4">
              {visibleSeries.map((group) => {
                const seriesType = group.episodes[0]?.type === 'podcast' ? 'podcast' : 'series';
                return (
                  <SeriesCard
                    key={group.series.id}
                    series={group.series}
                    episodes={group.episodes}
                    type={seriesType}
                  />
                );
              })}
            </div>
          )}

          {/* Standalone content (movies, or content without series) */}
          {standaloneContent.length > 0 && (
            <div>
              {visibleSeries.length > 0 && (
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  {activeTab === 'movies' ? 'Movies' : 'Other Content'}
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {standaloneContent.map((item) => (
                  <InstantLink
                    key={item.id}
                    href={`/mmi-plus/${item.id}`}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-400">{item.type}</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">
                        {item.description}
                      </p>
                      <RatingDisplay contentId={item.id} />
                      {item.duration && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {Math.floor(item.duration / 60)} min
                        </p>
                      )}
                    </div>
                  </InstantLink>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

