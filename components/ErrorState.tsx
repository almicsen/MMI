/**
 * Instant error state component
 * Shows immediately when there's an error or no connection
 */
'use client';

import { useEffect, useState } from 'react';
import Button from './ui/Button';

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
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-6 py-12 text-center">
        <div className="text-3xl">📡</div>
        <h3 className="text-lg font-semibold text-[color:var(--text-1)]">No internet connection</h3>
        <p className="text-sm text-[color:var(--text-3)]">Check your connection and try again.</p>
      </div>
    );
  }

  const errorMessage =
    message ||
    (error instanceof Error ? error.message : error) ||
    'Something went wrong';

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-6 py-12 text-center">
      <div className="text-3xl">⚠️</div>
      <h3 className="text-lg font-semibold text-[color:var(--text-1)]">Unable to load this section</h3>
      <p className="text-sm text-[color:var(--text-3)]">{errorMessage}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
