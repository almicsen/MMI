'use client';

import { useEffect, useState } from 'react';
import { getContentRating, submitRating, getUserRating } from '@/lib/firebase/ratings';
import { ContentRating } from '@/lib/firebase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface RatingDisplayProps {
  contentId: string;
  showReviews?: boolean;
}

export default function RatingDisplay({ contentId, showReviews = false }: RatingDisplayProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [rating, setRating] = useState<ContentRating | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    const loadRating = async () => {
      try {
        const [contentRating, userRatingData] = await Promise.all([
          getContentRating(contentId),
          user ? getUserRating(contentId, user.uid) : Promise.resolve(null),
        ]);
        setRating(contentRating);
        setUserRating(userRatingData);
      } catch (error) {
        console.error('Error loading rating:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRating();
  }, [contentId, user]);

  const handleRatingClick = async (newRating: number) => {
    if (!user) {
      toast.showWarning('Please log in to rate content');
      return;
    }

    setSubmitting(true);
    try {
      await submitRating(contentId, user.uid, newRating);
      const updatedRating = await getContentRating(contentId);
      setRating(updatedRating);
      setUserRating(newRating);
      toast.showSuccess('Rating submitted successfully!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.showError('Error submitting rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading rating...</div>;
  }

  const displayRating = rating 
    ? (hoverRating || userRating || Math.round(rating.averageRating))
    : (hoverRating || 0);

  // Render star component
  const renderStar = (starNumber: number, isClickable: boolean = false) => {
    const isFilled = starNumber <= displayRating;
    const StarIcon = isFilled ? (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    ) : (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );

    if (isClickable && user) {
      return (
        <button
          key={starNumber}
          onClick={() => handleRatingClick(starNumber)}
          disabled={submitting}
          onMouseEnter={() => setHoverRating(starNumber)}
          onMouseLeave={() => setHoverRating(null)}
          className={`transition-all ${
            isFilled
              ? 'text-yellow-400'
              : 'text-gray-300 dark:text-gray-600'
          } ${!submitting ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          {StarIcon}
        </button>
      );
    }

    return (
      <span
        key={starNumber}
        className={isFilled ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
      >
        {StarIcon}
      </span>
    );
  };

  if (!rating) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => renderStar(star, true))}
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">No ratings yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => renderStar(star, true))}
        </div>
        <div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {rating.averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
            ({rating.totalRatings} {rating.totalRatings === 1 ? 'rating' : 'ratings'})
          </span>
        </div>
      </div>

      {/* Rating Distribution */}
      {rating.ratingDistribution && (
        <div className="space-y-1 text-sm">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = rating.ratingDistribution[star as keyof typeof rating.ratingDistribution] || 0;
            const percentage = rating.totalRatings > 0 ? (count / rating.totalRatings) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-12 text-gray-600 dark:text-gray-400">{star} ⭐</span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-12 text-right text-gray-600 dark:text-gray-400">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Reviews */}
      {showReviews && rating.reviews && rating.reviews.length > 0 && (
        <div className="mt-4 space-y-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">Reviews</h4>
          {rating.reviews.slice(0, 5).map((review, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                    >
                      {star <= review.rating ? (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      )}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {review.createdAt && (
                    review.createdAt instanceof Date
                      ? review.createdAt.toLocaleDateString()
                      : typeof review.createdAt === 'object' && 'seconds' in review.createdAt
                      ? new Date((review.createdAt as any).seconds * 1000).toLocaleDateString()
                      : new Date(review.createdAt as any).toLocaleDateString()
                  )}
                </span>
              </div>
              {review.review && (
                <p className="text-sm text-gray-700 dark:text-gray-300">{review.review}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

