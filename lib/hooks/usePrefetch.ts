/**
 * Hook for prefetching routes on hover/focus
 * Makes navigation feel instant
 */
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function usePrefetch(href: string) {
  const router = useRouter();
  const prefetched = useRef(false);

  const prefetch = () => {
    if (!prefetched.current) {
      router.prefetch(href);
      prefetched.current = true;
    }
  };

  return { prefetch };
}

