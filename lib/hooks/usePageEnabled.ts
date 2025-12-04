'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getConfig } from '@/lib/firebase/firestore';
import { Config } from '@/lib/firebase/types';

type PageKey = 'about' | 'services' | 'blog' | 'contact' | 'projects' | 'mmiPlus';

const pageConfigMap: Record<PageKey, keyof Config> = {
  about: 'aboutEnabled',
  services: 'servicesEnabled',
  blog: 'blogEnabled',
  contact: 'contactEnabled',
  projects: 'projectsEnabled',
  mmiPlus: 'mmiPlusEnabled',
};

export function usePageEnabled(page: PageKey, redirectTo: string = '/') {
  const router = useRouter();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkPageEnabled = async () => {
      try {
        const config = await getConfig();
        const configKey = pageConfigMap[page];
        const isEnabled = config[configKey] !== false && (page !== 'blog' ? true : config.blogEnabled === true);
        
        if (!isMounted) return;
        
        setEnabled(isEnabled);
        
        if (!isEnabled) {
          // Redirect to home if page is disabled
          router.replace(redirectTo);
        }
      } catch (error) {
        console.error('Error checking page enabled status:', error);
        // On error, assume enabled to avoid blocking users
        if (isMounted) {
          setEnabled(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkPageEnabled();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, redirectTo]);

  return { enabled, loading };
}

