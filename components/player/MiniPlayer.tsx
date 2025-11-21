/**
 * Mini Player with Recommendations
 * Shows when video ends and auto-play is disabled
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Content } from '@/lib/firebase/types';
import { getUserRecommendations, getTopRecommendations } from '@/lib/firebase/userRecommendations';
import { useAuth } from '@/contexts/AuthContext';
import InstantLink from '@/components/InstantLink';

interface MiniPlayerProps {
  currentContent: Content;
  onClose?: () => void;
}

export default function MiniPlayer({ currentContent, onClose }: MiniPlayerProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Array<{ content: Content; score: number; reason: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const recs = user
          ? await getUserRecommendations(user.uid, 3)
          : await getTopRecommendations(3);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRecommendations();
  }, [user, currentContent.id]);

  const handlePlay = (contentId: string) => {
    router.push(`/mmi-plus/${contentId}`);
    if (onClose) onClose();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Up Next</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-gray-400">Loading recommendations...</div>
        ) : recommendations.length === 0 ? (
          <div className="text-gray-400">No recommendations available</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.content.id}
                className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => handlePlay(rec.content.id)}
              >
                {rec.content.thumbnailUrl ? (
                  <img
                    src={rec.content.thumbnailUrl}
                    alt={rec.content.title}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400">{rec.content.type}</span>
                  </div>
                )}
                <div className="p-3">
                  <h4 className="text-white font-semibold text-sm mb-1 line-clamp-1">
                    {rec.content.title}
                  </h4>
                  <p className="text-gray-400 text-xs line-clamp-2 mb-2">
                    {rec.content.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{rec.reason}</span>
                    <span className="text-xs text-blue-400">Score: {rec.score}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

