/**
 * MMI Token System
 * Handles token balance, transactions, and conversions
 */

import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MMIToken, TokenTransaction } from '@/lib/firebase/types';

// Token conversion rate: 1 USD = X tokens
const TOKEN_CONVERSION_RATE = 10; // 1 USD = 10 tokens (adjustable)

/**
 * Convert USD price to tokens
 */
export function usdToTokens(usdPrice: number): number {
  return Math.ceil(usdPrice * TOKEN_CONVERSION_RATE);
}

/**
 * Convert tokens to USD
 */
export function tokensToUsd(tokens: number): number {
  return tokens / TOKEN_CONVERSION_RATE;
}

/**
 * Get or create user's token balance
 */
export async function getUserTokens(userId: string): Promise<MMIToken> {
  try {
    const tokenDoc = await getDoc(doc(db, 'mmiTokens', userId));
    
    if (tokenDoc.exists()) {
      return { id: tokenDoc.id, ...tokenDoc.data() } as MMIToken;
    }
    
    // Create new token balance
    const newToken: MMIToken = {
      userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      lastUpdated: new Date(),
    };
    
    await setDoc(doc(db, 'mmiTokens', userId), {
      ...newToken,
      lastUpdated: Timestamp.now(),
    });
    
    return newToken;
  } catch (error) {
    console.error('Error getting user tokens:', error);
    throw error;
  }
}

/**
 * Add tokens to user's balance
 */
export async function addTokens(
  userId: string,
  amount: number,
  description: string,
  source?: string
): Promise<void> {
  try {
    const tokenDoc = doc(db, 'mmiTokens', userId);
    const currentToken = await getUserTokens(userId);
    
    const newBalance = currentToken.balance + amount;
    const newTotalEarned = currentToken.totalEarned + amount;
    
    await updateDoc(tokenDoc, {
      balance: newBalance,
      totalEarned: newTotalEarned,
      lastUpdated: Timestamp.now(),
    });
    
    // Record transaction
    await addDoc(collection(db, 'tokenTransactions'), {
      userId,
      type: 'earned',
      amount,
      description,
      source: source || 'reward',
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding tokens:', error);
    throw error;
  }
}

/**
 * Spend tokens from user's balance
 */
export async function spendTokens(
  userId: string,
  amount: number,
  description: string,
  source?: string
): Promise<boolean> {
  try {
    const currentToken = await getUserTokens(userId);
    
    if (currentToken.balance < amount) {
      return false; // Insufficient balance
    }
    
    const tokenDoc = doc(db, 'mmiTokens', userId);
    const newBalance = currentToken.balance - amount;
    const newTotalSpent = currentToken.totalSpent + amount;
    
    await updateDoc(tokenDoc, {
      balance: newBalance,
      totalSpent: newTotalSpent,
      lastUpdated: Timestamp.now(),
    });
    
    // Record transaction
    await addDoc(collection(db, 'tokenTransactions'), {
      userId,
      type: 'spent',
      amount: -amount, // Negative for spent
      description,
      source: source || 'purchase',
      createdAt: Timestamp.now(),
    });
    
    return true;
  } catch (error) {
    console.error('Error spending tokens:', error);
    throw error;
  }
}

/**
 * Get user's token transaction history
 */
export async function getUserTokenTransactions(
  userId: string,
  limit: number = 50
): Promise<TokenTransaction[]> {
  try {
    const q = query(
      collection(db, 'tokenTransactions'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as TokenTransaction))
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      })
      .slice(0, limit);
    
    return transactions;
  } catch (error) {
    console.error('Error getting token transactions:', error);
    return [];
  }
}

/**
 * Get token conversion rate
 */
export function getTokenConversionRate(): number {
  return TOKEN_CONVERSION_RATE;
}

