'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import LoadingState from '@/components/LoadingState';
import SectionHeading from '@/components/ui/SectionHeading';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import InstantLink from '@/components/InstantLink';
import { useAuth } from '@/contexts/AuthContext';

export default function About() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('about');
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
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
          setContent(`
            <h2>About MobileMediaInteractions</h2>
            <p>MobileMediaInteractions (MMI) is dedicated to innovating entertainment and building experiences that engage and inspire audiences.</p>
            <p>From interactive applications to podcasts and television content, we create media that connects people and tells compelling stories.</p>
            <h3>Our Mission</h3>
            <p>Innovating Entertainment, Building Experiences.</p>
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

  if (pageCheckLoading || !enabled) {
    return <LoadingState />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <section className="section">
        <SectionHeading
          eyebrow="Our story"
          title="A studio built on curiosity and momentum"
          subtitle="We focus on immersive entertainment experiences that feel natural on every screen."
        />
      </section>

      <section className="section-tight">
        <Card className="prose max-w-none prose-lg text-[color:var(--text-2)] dark:prose-invert">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 rounded-full bg-[color:var(--surface-4)] w-3/4 mb-4"></div>
              <div className="h-4 rounded-full bg-[color:var(--surface-4)] w-full mb-4"></div>
              <div className="h-4 rounded-full bg-[color:var(--surface-4)] w-5/6"></div>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content || '' }} />
          )}
        </Card>
      </section>

      <section className="section">
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[color:var(--brand-secondary)]">Connect with us</p>
            <p className="text-lg font-semibold text-[color:var(--text-1)]">Let’s talk about your next idea.</p>
            <p className="text-sm text-[color:var(--text-3)]">Contact is reserved for authenticated partners and collaborators.</p>
          </div>
          {user ? (
            <InstantLink href="/contact">
              <Button>Open contact</Button>
            </InstantLink>
          ) : (
            <InstantLink href="/login">
              <Button variant="outline">Sign in to connect</Button>
            </InstantLink>
          )}
        </Card>
      </section>
    </div>
  );
}
