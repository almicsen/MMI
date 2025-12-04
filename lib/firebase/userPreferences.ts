/**
 * User Preferences Management
 * Handles likes, favorites, and watchlist
 */

import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { User } from './types';

/**
 * Like a piece of content
 */
export async function likeContent(userId: string, contentId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      likes: arrayUnion(contentId),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error liking content:', error);
    throw error;
  }
}

/**
 * Unlike a piece of content
 */
export async function unlikeContent(userId: string, contentId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      likes: arrayRemove(contentId),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error unliking content:', error);
    throw error;
  }
}

/**
 * Add content to favorites
 */
export async function addToFavorites(userId: string, contentId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: arrayUnion(contentId),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

/**
 * Remove content from favorites
 */
export async function removeFromFavorites(userId: string, contentId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      favorites: arrayRemove(contentId),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
}

/**
 * Add content to watchlist
 */
export async function addToWatchlist(userId: string, contentId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      watchlist: arrayUnion(contentId),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
}

/**
 * Remove content from watchlist
 */
export async function removeFromWatchlist(userId: string, contentId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      watchlist: arrayRemove(contentId),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
}

/**
 * Check if user has liked content
 */
export async function hasLiked(userId: string, contentId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    const user = userDoc.data() as User;
    return (user.likes || []).includes(contentId);
  } catch (error) {
    console.error('Error checking like:', error);
    return false;
  }
}

/**
 * Check if content is in favorites
 */
export async function isFavorite(userId: string, contentId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    const user = userDoc.data() as User;
    return (user.favorites || []).includes(contentId);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
}

/**
 * Check if content is in watchlist
 */
export async function isInWatchlist(userId: string, contentId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return false;
    const user = userDoc.data() as User;
    return (user.watchlist || []).includes(contentId);
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
}

/**
 * Get user's liked content IDs
 */
export async function getUserLikes(userId: string): Promise<string[]> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return [];
    const user = userDoc.data() as User;
    return user.likes || [];
  } catch (error) {
    console.error('Error getting likes:', error);
    return [];
  }
}

/**
 * Get user's favorites
 */
export async function getUserFavorites(userId: string): Promise<string[]> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return [];
    const user = userDoc.data() as User;
    return user.favorites || [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
}

/**
 * Get user's watchlist
 */
export async function getUserWatchlist(userId: string): Promise<string[]> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return [];
    const user = userDoc.data() as User;
    return user.watchlist || [];
  } catch (error) {
    console.error('Error getting watchlist:', error);
    return [];
  }
}

