'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ComingSoonContent } from '@/lib/firebase/types';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface ComingSoonCardProps {
  content: ComingSoonContent;
  onViewEpisodes: (content: ComingSoonContent) => void;
}

export default function ComingSoonCard({ content, onViewEpisodes }: ComingSoonCardProps) {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if user is subscribed
  useEffect(() => {
    if (user) {
      setIsSubscribed(content.notifySubscribers?.includes(user.uid) || false);
    }
  }, [user, content.notifySubscribers]);

  const handleSubscribe = async () => {
    if (!user) {
      // Redirect to login or show message
      return;
    }

    setLoading(true);
    try {
      const contentRef = doc(db, 'comingSoon', content.id);
      const contentDoc = await getDoc(contentRef);
      
      if (contentDoc.exists()) {
        const currentSubscribers = contentDoc.data().notifySubscribers || [];
        
        if (currentSubscribers.includes(user.uid)) {
          // Unsubscribe
          await updateDoc(contentRef, {
            notifySubscribers: arrayRemove(user.uid),
          });
          setIsSubscribed(false);
        } else {
          // Subscribe
          await updateDoc(contentRef, {
            notifySubscribers: arrayUnion(user.uid),
          });
          setIsSubscribed(true);
        }
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden relative">
      <div className="relative w-full h-48 bg-black">
        {showTrailer && content.trailers && content.trailers.length > 0 ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={content.trailers[0]}
              className="w-full h-full object-cover"
              controls
              autoPlay
              onEnded={() => setShowTrailer(false)}
            />
            <button
              onClick={() => {
                setShowTrailer(false);
                if (videoRef.current) {
                  videoRef.current.pause();
                }
              }}
              className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors z-10"
              aria-label="Close trailer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            {content.thumbnailUrl ? (
              <img
                src={content.thumbnailUrl}
                alt={content.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{content.type}</span>
              </div>
            )}
            {content.trailers && content.trailers.length > 0 && (
              <button
                onClick={() => setShowTrailer(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group"
                aria-label="Play trailer"
              >
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                  <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="absolute bottom-4 left-4 text-white text-sm font-semibold bg-black/70 px-3 py-1 rounded">
                  Watch Trailer{content.trailers.length > 1 ? ` (${content.trailers.length})` : ''}
                </span>
              </button>
            )}
          </>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex-1">
            {content.title}
          </h3>
          <button
            onClick={handleSubscribe}
            disabled={loading || !user}
            className={`ml-2 p-2 rounded-full transition-colors ${
              isSubscribed
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-500'
            } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isSubscribed ? 'Unsubscribe from notifications' : 'Get notified when available'}
            aria-label={isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          >
            <svg
              className="w-6 h-6"
              fill={isSubscribed ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {content.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-4">
          {content.episodeCount && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              {content.episodeCount} {content.episodeCount === 1 ? 'Episode' : 'Episodes'}
            </span>
          )}
          {content.releaseDate && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(content.releaseDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {content.upcomingEpisodes && content.upcomingEpisodes.length > 0 && (
          <button
            onClick={() => onViewEpisodes(content)}
            className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline text-center"
          >
            View {content.upcomingEpisodes.length} upcoming {content.upcomingEpisodes.length === 1 ? 'episode' : 'episodes'}
          </button>
        )}
      </div>

      <div className="absolute top-2 right-2">
        <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded">
          Coming Soon
        </span>
      </div>
    </div>
  );
}

