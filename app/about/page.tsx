'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import LoadingState from '@/components/LoadingState';

export default function About() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('about');
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load data if page is enabled
    if (pageCheckLoading || !enabled) {
      return;
    }

    const loadContent = async () => {
      try {
        const docRef = doc(db, 'pages', 'about');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data().content);
        } else {
          // Default content
          setContent(`
            <h2>About MobileMediaInteractions</h2>
            <p>MobileMediaInteractions (MMI) is dedicated to innovating entertainment and building experiences that engage and inspire audiences.</p>
            <p>From interactive applications to podcasts and television content, we create media that connects people and tells compelling stories.</p>
            <h3>Our Mission</h3>
            <p>Innovating Entertainment, Building Experiences.</p>
            <h3>Contact</h3>
            <p>For inquiries, please visit our <a href="/contact">Contact page</a>.</p>
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
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">About Us</h1>
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

