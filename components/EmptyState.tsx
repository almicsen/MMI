/**
 * Instant empty state component
 * Shows immediately when there's no data
 */
'use client';

interface EmptyStateProps {
  message?: string;
  icon?: string;
}

export default function EmptyState({
  message = 'No content available.',
  icon = '📭',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
}

