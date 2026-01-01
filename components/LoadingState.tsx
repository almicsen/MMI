/**
 * Instant loading state component
 * Shows immediately while data is being fetched
 */
'use client';

interface LoadingStateProps {
  message?: string;
  skeleton?: boolean;
  count?: number;
}

export default function LoadingState({
  message = 'Loading...',
  skeleton = false,
  count = 3,
}: LoadingStateProps) {
  if (skeleton) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="surface-card animate-pulse"
          >
            <div className="h-40 rounded-xl bg-[color:var(--surface-4)] mb-4"></div>
            <div className="h-4 rounded-full bg-[color:var(--surface-4)] w-3/4 mb-2"></div>
            <div className="h-4 rounded-full bg-[color:var(--surface-4)] w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] shadow-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--brand-primary)] border-t-transparent"></div>
        </div>
        <p className="mt-4 text-sm text-[color:var(--text-3)]">{message}</p>
      </div>
    </div>
  );
}
