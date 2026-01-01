'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import LoadingState from '@/components/LoadingState';
import SectionHeading from '@/components/ui/SectionHeading';
import Card from '@/components/ui/Card';

export default function Services() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('services');
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          setContent(`
            <h2>Our Services</h2>
            <p>We partner with forward-looking entertainment teams to build cohesive product ecosystems.</p>
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

  const serviceCards = [
    {
      title: 'Immersive Media Production',
      description: 'Concept-to-launch production for premium video, audio, and interactive series.',
    },
    {
      title: 'Streaming Platform Strategy',
      description: 'Product architecture, content operations, and subscriber growth for digital hubs.',
    },
    {
      title: 'Experience Design',
      description: 'Native-feeling UX across iOS, Android, web, and connected devices.',
    },
    {
      title: 'Audience Insights',
      description: 'Data-driven experimentation, live ops, and personalization engines.',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <section className="section">
        <SectionHeading
          eyebrow="Services"
          title="We build end-to-end entertainment ecosystems"
          subtitle="Strategy, design, and engineering brought together to launch premium media products."  
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
        <div className="grid gap-6 md:grid-cols-2">
          {serviceCards.map((service) => (
            <Card key={service.title} className="space-y-3">
              <h3 className="text-lg font-semibold text-[color:var(--text-1)]">{service.title}</h3>
              <p className="text-sm text-[color:var(--text-3)]">{service.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
