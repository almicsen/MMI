'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  likeContent,
  unlikeContent,
  addToFavorites,
  removeFromFavorites,
  addToWatchlist,
  removeFromWatchlist,
  hasLiked,
  isFavorite,
  isInWatchlist,
} from '@/lib/firebase/userPreferences';

interface ContentActionsProps {
  contentId: string;
  className?: string;
}

export default function ContentActions({ contentId, className = '' }: ContentActionsProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [likedStatus, favoriteStatus, watchlistStatus] = await Promise.all([
          hasLiked(user.uid, contentId),
          isFavorite(user.uid, contentId),
          isInWatchlist(user.uid, contentId),
        ]);
        setLiked(likedStatus);
        setFavorited(favoriteStatus);
        setInWatchlist(watchlistStatus);
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, [user, contentId]);

  const handleLike = async () => {
    if (!user) {
      toast.showWarning('Please log in to like content');
      return;
    }

    try {
      if (liked) {
        await unlikeContent(user.uid, contentId);
        setLiked(false);
      } else {
        await likeContent(user.uid, contentId);
        setLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.showError('Error updating like status');
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      toast.showWarning('Please log in to favorite content');
      return;
    }

    try {
      if (favorited) {
        await removeFromFavorites(user.uid, contentId);
        setFavorited(false);
      } else {
        await addToFavorites(user.uid, contentId);
        setFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.showError('Error updating favorite status');
    }
  };

  const handleWatchlist = async () => {
    if (!user) {
      toast.showWarning('Please log in to add to watchlist');
      return;
    }

    try {
      if (inWatchlist) {
        await removeFromWatchlist(user.uid, contentId);
        setInWatchlist(false);
      } else {
        await addToWatchlist(user.uid, contentId);
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast.showError('Error updating watchlist');
    }
  };

  if (loading) {
    return <div className={`flex gap-2 ${className}`}>Loading...</div>;
  }

  if (!user) {
    return (
      <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        Log in to like, favorite, or add to watchlist
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        onClick={handleLike}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          liked
            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        title={liked ? 'Unlike' : 'Like'}
      >
        <span>{liked ? '❤️' : '🤍'}</span>
        <span className="text-sm">Like</span>
      </button>

      <button
        onClick={handleFavorite}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          favorited
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <span>{favorited ? '⭐' : '☆'}</span>
        <span className="text-sm">Favorite</span>
      </button>

      <button
        onClick={handleWatchlist}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          inWatchlist
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        <span>{inWatchlist ? '✓' : '+'}</span>
        <span className="text-sm">Watch Later</span>
      </button>
    </div>
  );
}

