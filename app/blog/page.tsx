'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/firebase/firestore';
import { BlogPost } from '@/lib/firebase/types';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import LoadingState from '@/components/LoadingState';
import SectionHeading from '@/components/ui/SectionHeading';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/EmptyState';

export default function Blog() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('blog');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const loadData = async () => {
      try {
        const data = await getBlogPosts();
        setPosts(data);
      } catch (error) {
        console.error('Error loading blog:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [enabled]);

  if (pageCheckLoading || !enabled) {
    return <LoadingState />;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="section">
          <div className="animate-pulse space-y-6">
            <div className="h-8 rounded-full bg-[color:var(--surface-4)] w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 rounded-full bg-[color:var(--surface-4)] w-full"></div>
              <div className="h-4 rounded-full bg-[color:var(--surface-4)] w-5/6"></div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <section className="section">
        <SectionHeading
          eyebrow="Studio journal"
          title="Insights from the MMI team"
          subtitle="Thought leadership, product thinking, and behind-the-scenes lessons from our studios."
        />
      </section>

      <section className="section-tight">
        {posts.length === 0 ? (
          <EmptyState message="No blog posts available yet." />
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[color:var(--text-1)]">
                    <Link href={`/blog/${post.id}`} className="hover:text-[color:var(--brand-primary)]">
                      {post.title}
                    </Link>
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-[color:var(--text-3)]">{post.excerpt}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[color:var(--text-4)]">
                  {post.createdAt && (
                    <span>
                      {post.createdAt instanceof Date
                        ? post.createdAt.toLocaleDateString()
                        : typeof post.createdAt === 'object' && 'seconds' in post.createdAt
                        ? new Date((post.createdAt as any).seconds * 1000).toLocaleDateString()
                        : new Date(post.createdAt as any).toLocaleDateString()}
                    </span>
                  )}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} tone="info">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
