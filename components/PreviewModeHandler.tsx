'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Component to handle preview mode (hides scrollbars when in iframe preview)
 */
export default function PreviewModeHandler() {
  const searchParams = useSearchParams();
  const isPreview = searchParams?.get('preview') === 'mobile';
  const hideScrollbars = searchParams?.get('hideScrollbars') === 'true';

  useEffect(() => {
    if (isPreview && hideScrollbars) {
      // Hide scrollbars
      const style = document.createElement('style');
      style.id = 'preview-hide-scrollbars';
      style.textContent = `
        html, body {
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        body {
          position: relative;
          width: 100% !important;
          max-width: 100% !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }
      `;
      document.head.appendChild(style);

      // Also set body styles directly
      document.body.style.overflowX = 'hidden';
      document.body.style.setProperty('-webkit-overflow-scrolling', 'touch');

      return () => {
        const existingStyle = document.getElementById('preview-hide-scrollbars');
        if (existingStyle) {
          existingStyle.remove();
        }
        document.body.style.overflowX = '';
        document.body.style.removeProperty('-webkit-overflow-scrolling');
      };
    }
  }, [isPreview, hideScrollbars]);

  return null;
}

