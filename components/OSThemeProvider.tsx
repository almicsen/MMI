'use client';

import { useEffect, useState } from 'react';
import { detectOS, getOSDesignMetrics, OperatingSystem } from '@/lib/utils/osDetection';

interface OSThemeProviderProps {
  children: React.ReactNode;
}

export default function OSThemeProvider({ children }: OSThemeProviderProps) {
  const [os, setOS] = useState<OperatingSystem>('unknown');
  const [metrics, setMetrics] = useState(getOSDesignMetrics('unknown'));

  useEffect(() => {
    const detectedOS = detectOS();
    const osMetrics = getOSDesignMetrics(detectedOS);
    
    setOS(detectedOS);
    setMetrics(osMetrics);

    // Apply OS-specific CSS variables
    const root = document.documentElement;
    root.style.setProperty('--os-spacing-unit', `${osMetrics.spacing.unit}px`);
    root.style.setProperty('--os-spacing-small', `${osMetrics.spacing.small}px`);
    root.style.setProperty('--os-spacing-medium', `${osMetrics.spacing.medium}px`);
    root.style.setProperty('--os-spacing-large', `${osMetrics.spacing.large}px`);
    root.style.setProperty('--os-spacing-xlarge', `${osMetrics.spacing.xlarge}px`);
    root.style.setProperty('--os-radius-small', `${osMetrics.borderRadius.small}px`);
    root.style.setProperty('--os-radius-medium', `${osMetrics.borderRadius.medium}px`);
    root.style.setProperty('--os-radius-large', `${osMetrics.borderRadius.large}px`);
    root.style.setProperty('--os-radius-xlarge', `${osMetrics.borderRadius.xlarge}px`);
    root.style.setProperty('--os-font-family', osMetrics.typography.fontFamily);
    root.style.setProperty('--os-color-primary', osMetrics.colors.primary);
    root.style.setProperty('--os-color-secondary', osMetrics.colors.secondary);
    root.style.setProperty('--os-color-background', osMetrics.colors.background);
    root.style.setProperty('--os-color-surface', osMetrics.colors.surface);
    root.style.setProperty('--os-color-text', osMetrics.colors.text);
    root.style.setProperty('--os-shadow-small', osMetrics.shadows.small);
    root.style.setProperty('--os-shadow-medium', osMetrics.shadows.medium);
    root.style.setProperty('--os-shadow-large', osMetrics.shadows.large);

    // Add OS class to body for CSS targeting
    document.body.classList.add(`os-${detectedOS}`);
    
    return () => {
      document.body.classList.remove(`os-${detectedOS}`);
    };
  }, []);

  return <>{children}</>;
}

