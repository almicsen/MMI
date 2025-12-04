'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBlogPosts } from '@/lib/firebase/firestore';
import { BlogPost } from '@/lib/firebase/types';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import LoadingState from '@/components/LoadingState';

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

  // If page is disabled, the hook will redirect, so we don't need to render anything
  if (pageCheckLoading || !enabled) {
    return <LoadingState />;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Blog</h1>
      
      {posts.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No blog posts available yet.</p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
                <Link href={`/blog/${post.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                  {post.title}
                </Link>
              </h2>
              {post.excerpt && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{post.excerpt}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
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
                  <div className="flex gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

