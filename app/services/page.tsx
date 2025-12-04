'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import LoadingState from '@/components/LoadingState';

export default function Services() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('services');
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load data if page is enabled
    if (pageCheckLoading || !enabled) {
      return;
    }
    const loadContent = async () => {
      try {
        const docRef = doc(db, 'pages', 'services');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data().content);
        } else {
          // Default content
          setContent(`
            <h2>Our Services</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3>Media Production</h3>
                <p>We create engaging video content, series, and interactive media experiences.</p>
              </div>
              <div>
                <h3>Podcast Development</h3>
                <p>From concept to distribution, we help bring your podcast ideas to life.</p>
              </div>
              <div>
                <h3>Interactive Applications</h3>
                <p>Building innovative apps and platforms that engage users in new ways.</p>
              </div>
              <div>
                <h3>Content Strategy</h3>
                <p>Strategic planning and execution for your media and entertainment projects.</p>
              </div>
            </div>
          `);
        }
      } catch (error) {
        console.error('Error loading content:', error);
        setContent('<p>Error loading content. Please try again later.</p>');
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, [pageCheckLoading, enabled]);

  // If page is disabled, the hook will redirect, so we don't need to render anything
  if (pageCheckLoading || !enabled) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Services</h1>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      ) : (
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content || '' }}
        />
      )}
    </div>
  );
}

