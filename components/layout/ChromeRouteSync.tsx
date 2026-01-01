'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ChromeRouteSync() {
  const pathname = usePathname();

  useEffect(() => {
    const hide = pathname?.startsWith('/admin') || pathname?.startsWith('/live');
    document.documentElement.dataset.hideChrome = hide ? 'true' : 'false';
  }, [pathname]);

  return null;
}
