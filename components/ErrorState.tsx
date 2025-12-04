/**
 * Instant error state component
 * Shows immediately when there's an error or no connection
 */
'use client';

import { useEffect, useState } from 'react';

interface ErrorStateProps {
  error?: Error | string | null;
  onRetry?: () => void;
  message?: string;
}

export default function ErrorState({
  error,
  onRetry,
  message,
}: ErrorStateProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">📡</div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          No Internet Connection
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please check your connection and try again.
        </p>
      </div>
    );
  }

  const errorMessage =
    message ||
    (error instanceof Error ? error.message : error) ||
    'Something went wrong';

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
        Error Loading Content
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{errorMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

