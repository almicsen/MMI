'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserThemePreference } from '@/lib/firebase/auth';

export default function ThemeSync() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const lastSyncedTheme = useRef<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !user?.themePreference) return;
    if (theme !== user.themePreference) {
      setTheme(user.themePreference);
    }
  }, [hydrated, setTheme, theme, user?.themePreference]);

  useEffect(() => {
    if (!hydrated || !user) return;
    const nextTheme = theme === 'system' ? resolvedTheme : theme;
    if (!nextTheme || nextTheme === lastSyncedTheme.current) return;
    updateUserThemePreference(user.uid, nextTheme).catch((error) => {
      console.error('Failed to sync theme preference:', error);
    });
    lastSyncedTheme.current = nextTheme;
  }, [hydrated, resolvedTheme, theme, user]);

  return null;
}
