/**
 * Content Rating System
 * Allows users to rate content and displays ratings
 */

import { collection, addDoc, doc, getDoc, getDocs, query, where, Timestamp, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from './config';
import { ContentRating } from './types';

/**
 * Submit a rating for content
 */
export async function submitRating(
  contentId: string,
  userId: string,
  rating: number,
  review?: string
): Promise<void> {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  try {
    const ratingRef = doc(db, 'contentRatings', contentId);
    const ratingDoc = await getDoc(ratingRef);

    // Check if user already rated
    let existingRating = null;
    if (ratingDoc.exists()) {
      const data = ratingDoc.data() as ContentRating;
      existingRating = data.reviews?.find((r) => r.userId === userId);
    }

    const reviewData = {
      userId,
      rating,
      review: review || '',
      createdAt: Timestamp.now(),
    };

    if (existingRating) {
      // Update existing rating
      const reviews = ratingDoc.data()?.reviews || [];
      const reviewIndex = reviews.findIndex((r: any) => r.userId === userId);
      const oldRating = reviews[reviewIndex].rating;

      reviews[reviewIndex] = reviewData;

      // Update distribution
      const distribution = ratingDoc.data()?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      distribution[oldRating as keyof typeof distribution]--;
      distribution[rating as keyof typeof distribution]++;

      // Recalculate average
      const totalRatings = reviews.length;
      const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
      const averageRating = sum / totalRatings;

      await updateDoc(ratingRef, {
        averageRating,
        ratingDistribution: distribution,
        reviews,
        updatedAt: Timestamp.now(),
      });
    } else {
      // New rating
      const reviews = ratingDoc.exists() ? [...(ratingDoc.data()?.reviews || []), reviewData] : [reviewData];
      const totalRatings = reviews.length;
      const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
      const averageRating = sum / totalRatings;

      const distribution = ratingDoc.exists()
        ? { ...ratingDoc.data()?.ratingDistribution }
        : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      distribution[rating as keyof typeof distribution]++;

      await setDoc(
        ratingRef,
        {
          contentId,
          averageRating,
          totalRatings,
          ratingDistribution: distribution,
          reviews,
          createdAt: ratingDoc.exists() ? ratingDoc.data()?.createdAt : Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw error;
  }
}

/**
 * Get rating for content
 */
export async function getContentRating(contentId: string): Promise<ContentRating | null> {
  try {
    const ratingRef = doc(db, 'contentRatings', contentId);
    const ratingDoc = await getDoc(ratingRef);

    if (!ratingDoc.exists()) {
      return null;
    }

    return { contentId: ratingDoc.id, ...ratingDoc.data() } as ContentRating;
  } catch (error) {
    console.error('Error getting rating:', error);
    return null;
  }
}

/**
 * Get user's rating for content
 */
export async function getUserRating(contentId: string, userId: string): Promise<number | null> {
  try {
    const rating = await getContentRating(contentId);
    if (!rating || !rating.reviews) return null;

    const userReview = rating.reviews.find((r) => r.userId === userId);
    return userReview ? userReview.rating : null;
  } catch (error) {
    console.error('Error getting user rating:', error);
    return null;
  }
}

