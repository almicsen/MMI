/**
 * Instant empty state component
 * Shows immediately when there's no data
 */
'use client';

interface EmptyStateProps {
  message?: string;
  icon?: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  message = 'No content available yet.',
  icon = '📭',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-6 py-12 text-center">
      <div className="text-3xl" aria-hidden>
        {icon}
      </div>
      <p className="text-sm text-[color:var(--text-3)]">{message}</p>
      {action}
    </div>
  );
}
