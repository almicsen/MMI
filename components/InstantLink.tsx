/**
 * Instant navigation Link component
 * Prefetches on hover/focus for instant navigation
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrefetch } from '@/lib/hooks/usePrefetch';
import { ReactNode } from 'react';

interface InstantLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  [key: string]: any;
}

export default function InstantLink({
  href,
  children,
  className,
  prefetch = true,
  ...props
}: InstantLinkProps) {
  const router = useRouter();
  const { prefetch: prefetchRoute } = usePrefetch(href);

  const handleMouseEnter = () => {
    if (prefetch) {
      prefetchRoute();
      router.prefetch(href);
    }
  };

  const handleFocus = () => {
    if (prefetch) {
      prefetchRoute();
      router.prefetch(href);
    }
  };

  return (
    <Link
      href={href}
      className={className}
      prefetch={prefetch}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </Link>
  );
}

