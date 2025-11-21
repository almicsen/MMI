'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import InstantLink from '@/components/InstantLink';
import MMIVideoPlayer from '@/components/player/MMIVideoPlayer';
import MMIAudioPlayer from '@/components/player/MMIAudioPlayer';
import RatingDisplay from '@/components/RatingDisplay';
import ContentActions from '@/components/ContentActions';
import { getContentById } from '@/lib/firebase/firestore';
import { Content, ContentPlayerConfig } from '@/lib/firebase/types';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function ContentPlayer() {
  const params = useParams();
  const { user } = useAuth();
  const [content, setContent] = useState<Content | null>(null);
  const [playerConfig, setPlayerConfig] = useState<ContentPlayerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

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

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <InstantLink href="/mmi-plus" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
        ← Back to MMI+
      </InstantLink>
      
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">{content.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{content.description}</p>
          </div>
          <div className="ml-6">
            <RatingDisplay contentId={content.id} />
          </div>
        </div>
        <ContentActions contentId={content.id} />
      </div>

      <div className="mb-6">
        {content.type === 'podcast' ? (
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

