'use client';

import { useState } from 'react';
import InstantLink from '@/components/InstantLink';
import RatingDisplay from '@/components/RatingDisplay';
import { Series, Content } from '@/lib/firebase/types';

interface SeriesCardProps {
  series: Series;
  episodes: Content[];
  type: 'series' | 'podcast';
}

export default function SeriesCard({ series, episodes, type }: SeriesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sortedEpisodes = [...episodes].sort((a, b) => {
    // Sort by season, then episode number
    if (a.seasonNumber !== b.seasonNumber) {
      return (a.seasonNumber || 0) - (b.seasonNumber || 0);
    }
    return (a.episodeNumber || 0) - (b.episodeNumber || 0);
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      {/* Series Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <div className="flex items-center gap-4 p-4">
          {/* Series Thumbnail/Logo */}
          <div className="flex-shrink-0">
            {series.logoUrl || series.thumbnailUrl ? (
              <img
                src={series.logoUrl || series.thumbnailUrl}
                alt={series.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {series.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Series Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                  {series.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">
                  {series.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                  <span>{episodes.length} {episodes.length === 1 ? 'Episode' : 'Episodes'}</span>
                  {type === 'podcast' && <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">Podcast</span>}
                </div>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Episodes List - Expandable */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Episodes ({sortedEpisodes.length})
            </h4>
            <div className="space-y-3">
              {sortedEpisodes.map((episode) => (
                <InstantLink
                  key={episode.id}
                  href={`/mmi-plus/${episode.id}`}
                  className="block bg-white dark:bg-gray-800 rounded-lg p-3 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    {episode.thumbnailUrl ? (
                      <img
                        src={episode.thumbnailUrl}
                        alt={episode.title}
                        className="w-20 h-20 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-xs">EP</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {episode.title}
                        </h5>
                        {(episode.seasonNumber || episode.episodeNumber) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                            S{episode.seasonNumber || 1}E{episode.episodeNumber || 0}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {episode.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="text-xs">
                          <RatingDisplay contentId={episode.id} />
                        </div>
                        {episode.duration && (
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {Math.floor(episode.duration / 60)} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </InstantLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

