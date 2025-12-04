'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandling } from '@/lib/errorHandler';

export default function GlobalErrorHandler() {
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return null;
}

