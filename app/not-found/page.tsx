'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InstantLink from '@/components/InstantLink';

export default function NotFoundPage() {
  const router = useRouter();

  useEffect(() => {
    // Log 404 to telemetry if available
    if (typeof window !== 'undefined') {
      const errorInfo = {
        type: '404_not_found',
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
      // Could send to telemetry service here
      console.warn('404 page accessed:', errorInfo);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center px-4 max-w-md">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Go Back
          </button>
          <InstantLink
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Go Home
          </InstantLink>
        </div>
      </div>
    </div>
  );
}

