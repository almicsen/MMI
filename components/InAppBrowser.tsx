'use client';

import { useState, useEffect, useRef } from 'react';

interface InAppBrowserProps {
  url: string;
  title?: string;
  onClose: () => void;
}

export default function InAppBrowser({ url, title, onClose }: InAppBrowserProps) {
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    setCurrentUrl(url);
    setLoading(true);
  }, [url]);

  const handleLoad = () => {
    setLoading(false);
    // Note: Cross-origin restrictions prevent checking history
    // We'll just enable/disable based on navigation
    setCanGoBack(false);
    setCanGoForward(false);
  };

  const handleBack = () => {
    // In a real implementation, you'd track history
    // For now, we'll just reload
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.history.back();
    }
  };

  const handleForward = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.history.forward();
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setLoading(true);
    }
  };

  const handleExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col in-app-browser">
      {/* Mobile-optimized header */}
      <div className="bg-slate-900 border-b border-cyan-500/20 flex items-center gap-2 px-3 py-2.5 safe-area-top">
        <button
          onClick={onClose}
          className="p-2.5 -ml-1 text-cyan-400 hover:text-cyan-300 active:scale-95 transition-all touch-manipulation"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0 mx-2">
          <div className="flex-1 bg-slate-800 rounded-lg px-3 py-2 border border-cyan-500/20 min-w-0">
            <div className="text-xs text-cyan-300 truncate font-mono">
              {currentUrl}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={handleBack}
            disabled={!canGoBack}
            className="p-2.5 text-cyan-400 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all touch-manipulation"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleForward}
            disabled={!canGoForward}
            className="p-2.5 text-cyan-400 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all touch-manipulation"
            aria-label="Go forward"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={handleRefresh}
            className="p-2.5 text-cyan-400 hover:text-cyan-300 active:scale-95 transition-all touch-manipulation"
            aria-label="Refresh"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={handleExternal}
            className="p-2.5 text-cyan-400 hover:text-cyan-300 active:scale-95 transition-all touch-manipulation"
            aria-label="Open in external browser"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-cyan-500/20">
            <div className="flex items-center gap-2 text-cyan-300">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        </div>
      )}

      {/* Browser content */}
      <div className="flex-1 relative overflow-hidden">
        <iframe
          ref={iframeRef}
          src={currentUrl}
          className="w-full h-full border-0"
          onLoad={handleLoad}
          title={title || 'In-app browser'}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation"
        />
      </div>

      {/* Mobile bottom safe area */}
      <div className="h-safe-area-bottom bg-slate-900"></div>
    </div>
  );
}

