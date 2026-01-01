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
import { Content, Series, ComingSoonContent, TriviaChallenge } from '@/lib/firebase/types';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import TriviaChallengeComponent from '@/components/trivia/TriviaChallenge';
import TokenBalance from '@/components/TokenBalance';
import SectionHeading from '@/components/ui/SectionHeading';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function MMIPlus() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('mmiPlus');
  
  // All hooks must be called before any conditional returns (Rules of Hooks)
  const [activeTab, setActiveTab] = useState<'all' | 'series' | 'movies' | 'podcasts' | 'audiobooks' | 'coming-soon'>('all');
  const [content, setContent] = useState<Content[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [comingSoon, setComingSoon] = useState<ComingSoonContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState<ComingSoonContent | null>(null);
  const [triviaChallenges, setTriviaChallenges] = useState<TriviaChallenge[]>([]);
  const [selectedTrivia, setSelectedTrivia] = useState<TriviaChallenge | null>(null);
  const [showTrivia, setShowTrivia] = useState(false);

  useEffect(() => {
    // Only load data if page is enabled
    if (pageCheckLoading || !enabled) {
      return;
    }

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
    loadTriviaChallenges();
  }, [pageCheckLoading, enabled]);

  const loadTriviaChallenges = async () => {
    try {
      const q = query(
        collection(db, 'triviaChallenges'),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setTriviaChallenges(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as TriviaChallenge[]);
    } catch (error) {
      console.error('Error loading trivia challenges:', error);
    }
  };

  // If page is disabled, the hook will redirect, so we don't need to render anything
  if (pageCheckLoading || !enabled) {
    return <LoadingState />;
  }

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
          (activeTab === 'podcasts' && item.type === 'podcast') ||
          (activeTab === 'audiobooks' && item.type === 'audiobook');
        
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
      (activeTab === 'podcasts' && item.type === 'podcast') ||
      (activeTab === 'audiobooks' && item.type === 'audiobook');
    
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

  if (showTrivia && selectedTrivia) {
    return (
      <TriviaChallengeComponent
        challenge={selectedTrivia}
        onComplete={(tokensEarned) => {
          setShowTrivia(false);
          setSelectedTrivia(null);
          // Show success message
          alert(`Congratulations! You earned ${tokensEarned} tokens!`);
        }}
        onExit={() => {
          setShowTrivia(false);
          setSelectedTrivia(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="section-tight flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <SectionHeading
          eyebrow="Streaming"
          title="MMI+"
          subtitle="Premium originals, series, and podcasts designed for immersive viewing."
        />
        <div className="flex items-center gap-3">
          <TokenBalance />
        </div>
      </section>
      
      {/* Trivia Challenges Section */}
      {triviaChallenges.length > 0 && (
        <section className="section-tight">
          <div className="surface-card p-6">
            <h2 className="text-2xl font-semibold text-[color:var(--text-1)] mb-2">🧠 Trivia Challenges</h2>
            <p className="text-sm text-[color:var(--text-3)] mb-4">Test your knowledge and earn MMI Tokens.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {triviaChallenges.map((challenge) => (
                <button
                  key={challenge.id}
                  className="surface-card w-full cursor-pointer border border-[color:var(--border-subtle)] p-4 text-left"
                  onClick={() => {
                    setSelectedTrivia(challenge);
                    setShowTrivia(true);
                  }}
                >
                  <h3 className="font-semibold text-[color:var(--text-1)] mb-2">{challenge.name}</h3>
                  <p className="text-xs text-[color:var(--text-4)] mb-2">
                    Mixed difficulty (easy • medium • hard)
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[color:var(--text-3)]">
                      {challenge.questionsCount} questions • {challenge.timePerQuestion}s each
                    </span>
                    <span className="font-semibold text-amber-500">
                      Up to {challenge.questionsCount * challenge.tokenReward} 🪙
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
      
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-1/2"
        />
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {(['all', 'series', 'movies', 'podcasts', 'audiobooks', 'coming-soon'] as const).map((tab) => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            size="sm"
            className="whitespace-nowrap"
          >
            {tab === 'coming-soon' ? 'Coming Soon' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
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
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex-1">
                          {item.title}
                        </h3>
                        {item.isPaid && (
                          <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full font-semibold ml-2">
                            ${item.price?.toFixed(2) || '0.00'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">
                        {item.description}
                      </p>
                      {item.trailerUrl && (
                        <div className="mb-2">
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            {item.type === 'audiobook' ? '📖 Sample Available' : '▶ Trailer Available'}
                          </span>
                        </div>
                      )}
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
