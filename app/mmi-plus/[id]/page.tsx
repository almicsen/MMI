'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import InstantLink from '@/components/InstantLink';
import MMIVideoPlayer from '@/components/player/MMIVideoPlayer';
import MMIAudioPlayer from '@/components/player/MMIAudioPlayer';
import MMIAudiobookPlayer from '@/components/player/MMIAudiobookPlayer';
import TrailerPlayer from '@/components/player/TrailerPlayer';
import RatingDisplay from '@/components/RatingDisplay';
import ContentActions from '@/components/ContentActions';
import { getContentById } from '@/lib/firebase/firestore';
import { Content, ContentPlayerConfig } from '@/lib/firebase/types';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUserTokens, spendTokens, usdToTokens } from '@/lib/tokens/tokenSystem';
import { useToast } from '@/contexts/ToastContext';

export default function ContentPlayer() {
  const params = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [content, setContent] = useState<Content | null>(null);
  const [playerConfig, setPlayerConfig] = useState<ContentPlayerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [userTokens, setUserTokens] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'tokens'>('tokens');

  useEffect(() => {
    const loadContent = async () => {
      try {
        if (params.id && typeof params.id === 'string') {
          const [contentData, configDoc] = await Promise.all([
            getContentById(params.id),
            getDoc(doc(db, 'playerConfigs', params.id)),
          ]);
          
          setContent(contentData);
          
          if (configDoc.exists()) {
            setPlayerConfig(configDoc.data() as ContentPlayerConfig);
          }
          
          // Load user tokens
          if (user) {
            const tokens = await getUserTokens(user.uid);
            setUserTokens(tokens.balance);
          }
          
          // Check if content is paid and user has access
          if (contentData?.isPaid && user) {
            // Check if user has purchased this content
            const purchaseDoc = await getDoc(doc(db, 'purchases', `${user.uid}_${contentData.id}`));
            setHasAccess(purchaseDoc.exists());
          } else if (contentData?.isPaid && !user) {
            setHasAccess(false);
          } else {
            setHasAccess(true);
          }
          
          // Show trailer if available
          if (contentData?.trailerUrl) {
            setShowTrailer(true);
          }
          
          // Load user progress if logged in
          if (user && contentData) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const contentProgress = userData.progress?.[params.id];
              if (contentProgress) {
                setProgress(contentProgress.progress || 0);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [params.id, user]);

  const handleProgressUpdate = async (newProgress: number) => {
    setProgress(newProgress);
    
    if (user && content) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const currentProgress = userDoc.data()?.progress || {};
        
        await updateDoc(userRef, {
          progress: {
            ...currentProgress,
            [content.id]: {
              progress: newProgress,
              completed: newProgress >= 95,
              lastWatched: new Date(),
            },
          },
        });
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Content Not Found</h1>
        <InstantLink href="/mmi-plus" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to MMI+
        </InstantLink>
      </div>
    );
  }

  // Show trailer if available
  if (showTrailer && content.trailerUrl) {
    return (
      <TrailerPlayer
        content={content}
        onTrailerComplete={() => setShowTrailer(false)}
        onSkip={() => setShowTrailer(false)}
      />
    );
  }

  // Show payment required if content is paid and user doesn't have access
  if (content.isPaid && !hasAccess) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <InstantLink href="/mmi-plus" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
          ← Back to MMI+
        </InstantLink>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium Content</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This content requires a purchase to access.
            </p>
            {content.trailerUrl && (
              <button
                onClick={() => setShowTrailer(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
              >
                Watch {content.type === 'audiobook' ? 'Sample' : 'Trailer'}
              </button>
            )}
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 mb-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ${content.price?.toFixed(2) || '0.00'}
            </div>
            <div className="space-y-4">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentMethod('tokens')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      paymentMethod === 'tokens'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    🪙 Tokens ({usdToTokens(content.price || 0)} tokens)
                  </button>
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      paymentMethod === 'stripe'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    💳 Stripe (${content.price?.toFixed(2) || '0.00'})
                  </button>
                </div>
              </div>
              
              {/* Token Balance Display */}
              {paymentMethod === 'tokens' && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Your Balance:</span>
                    <span className="font-semibold text-yellow-600">{userTokens} 🪙</span>
                  </div>
                  {userTokens < usdToTokens(content.price || 0) && (
                    <p className="text-xs text-red-600 mt-1">
                      Insufficient tokens. Need {usdToTokens(content.price || 0) - userTokens} more.
                    </p>
                  )}
                </div>
              )}
              
              <button
                onClick={async () => {
                  if (!user) {
                    alert('Please log in to purchase content');
                    return;
                  }
                  
                  if (paymentMethod === 'tokens') {
                    const tokensNeeded = usdToTokens(content.price || 0);
                    if (userTokens < tokensNeeded) {
                      toast.showError(`Insufficient tokens. You need ${tokensNeeded} tokens.`);
                      return;
                    }
                    
                    try {
                      const success = await spendTokens(
                        user.uid,
                        tokensNeeded,
                        `Purchased: ${content.title}`,
                        'content_purchase'
                      );
                      
                      if (success) {
                        // Record purchase
                        await addDoc(collection(db, 'purchases'), {
                          userId: user.uid,
                          contentId: content.id,
                          price: content.price || 0,
                          purchasedAt: Timestamp.now(),
                          paymentMethod: 'tokens',
                          tokensUsed: tokensNeeded,
                        });
                        
                        toast.showSuccess('Content purchased with tokens!');
                        setHasAccess(true);
                        // Reload tokens
                        const tokens = await getUserTokens(user.uid);
                        setUserTokens(tokens.balance);
                      } else {
                        toast.showError('Failed to process token payment');
                      }
                    } catch (error) {
                      console.error('Error purchasing with tokens:', error);
                      toast.showError('Error processing payment');
                    }
                  } else {
                    // Stripe payment (TODO: integrate)
                    alert('Stripe payment integration coming soon!');
                  }
                }}
                disabled={paymentMethod === 'tokens' && userTokens < usdToTokens(content.price || 0)}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentMethod === 'tokens'
                  ? `Purchase with ${usdToTokens(content.price || 0)} 🪙`
                  : `Purchase for $${content.price?.toFixed(2) || '0.00'}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <InstantLink href="/mmi-plus" className="text-[color:var(--brand-primary)] hover:underline mb-4 inline-block text-sm font-semibold">
        ← Back to MMI+
      </InstantLink>
      
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl sm:text-4xl font-semibold text-[color:var(--text-1)]">{content.title}</h1>
              {content.isPaid && (
                <span className="px-3 py-1 bg-[color:var(--brand-highlight)] text-white text-xs rounded-full font-semibold">
                  Premium
                </span>
              )}
            </div>
            <p className="text-[color:var(--text-3)] mb-4">{content.description}</p>
            {content.trailerUrl && (
              <button
                onClick={() => setShowTrailer(true)}
                className="px-4 py-2 bg-[color:var(--brand-primary)] text-white rounded-full hover:opacity-90 transition-colors text-sm mb-4"
              >
                {content.type === 'audiobook' ? '▶ Play Sample' : '▶ Watch Trailer'}
              </button>
            )}
          </div>
          <div className="ml-6">
            <RatingDisplay contentId={content.id} />
          </div>
        </div>
        <ContentActions contentId={content.id} />
      </div>

      <div className="mb-6">
        {content.type === 'audiobook' ? (
          <MMIAudiobookPlayer content={content} onProgressUpdate={handleProgressUpdate} />
        ) : content.type === 'podcast' ? (
          <MMIAudioPlayer content={content} onProgressUpdate={handleProgressUpdate} />
        ) : (
          <MMIVideoPlayer
            content={content}
            config={playerConfig || undefined}
            onProgressUpdate={handleProgressUpdate}
            className="aspect-video"
          />
        )}
      </div>

      {user && progress > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Your progress: {Math.round(progress)}%
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
