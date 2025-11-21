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
    const checkPageEnabled = async () => {
      try {
        const config = await getConfig();
        const configKey = pageConfigMap[page];
        const isEnabled = config[configKey] !== false && (page !== 'blog' ? true : config.blogEnabled === true);
        
        setEnabled(isEnabled);
        
        if (!isEnabled) {
          // Redirect to home if page is disabled
          router.replace(redirectTo);
        }
      } catch (error) {
        console.error('Error checking page enabled status:', error);
        // On error, assume enabled to avoid blocking users
        setEnabled(true);
      } finally {
        setLoading(false);
      }
    };

    checkPageEnabled();
  }, [page, redirectTo, router]);

  return { enabled, loading };
}

