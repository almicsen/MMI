'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getBlogPost } from '@/lib/firebase/firestore';
import { BlogPost } from '@/lib/firebase/types';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import LoadingState from '@/components/LoadingState';

export default function BlogPostPage() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('blog');
  const params = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  // If page is disabled, the hook will redirect, so we don't need to render anything
  if (pageCheckLoading || !enabled) {
    return <LoadingState />;
  }

  useEffect(() => {
    const loadPost = async () => {
      try {
        if (params.id && typeof params.id === 'string') {
          const data = await getBlogPost(params.id);
          setPost(data);
        }
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Post Not Found</h1>
        <Link href="/blog" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href="/blog" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
        ← Back to Blog
      </Link>
      <article>
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">{post.title}</h1>
        {post.createdAt && (
          <p className="text-gray-500 dark:text-gray-500 mb-6">
            {post.createdAt instanceof Date
              ? post.createdAt.toLocaleDateString()
              : typeof post.createdAt === 'object' && 'seconds' in post.createdAt
              ? new Date((post.createdAt as any).seconds * 1000).toLocaleDateString()
              : new Date(post.createdAt as any).toLocaleDateString()}
          </p>
        )}
        {post.tags.length > 0 && (
          <div className="flex gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}

