'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

type DeviceType = 'iphone' | 'ipad' | 'desktop';

interface DeviceConfig {
  name: string;
  width: number;
  height: number;
  icon: string;
  frameClass: string;
}

const deviceConfigs: Record<DeviceType, DeviceConfig> = {
  iphone: {
    name: 'iPhone',
    width: 390,
    height: 844,
    icon: '📱',
    frameClass: 'iphone-frame',
  },
  ipad: {
    name: 'iPad',
    width: 820,
    height: 1180,
    icon: '📱',
    frameClass: 'ipad-frame',
  },
  desktop: {
    name: 'Desktop',
    width: 1920,
    height: 1080,
    icon: '💻',
    frameClass: 'desktop-frame',
  },
};

interface SitePreviewProps {
  className?: string;
  visible?: boolean;
  onToggle?: () => void;
  autoNavigateTo?: string; // Auto-navigate to this path when set
}

export default function SitePreview({ className = '', visible = true, onToggle, autoNavigateTo }: SitePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [currentPath, setCurrentPath] = useState('/');
  const [scale, setScale] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  
  // Auto-navigate when autoNavigateTo changes
  useEffect(() => {
    if (autoNavigateTo && autoNavigateTo !== currentPath) {
      setCurrentPath(autoNavigateTo);
      if (iframeRef.current) {
        const url = `${previewUrl}${autoNavigateTo}${(deviceType === 'iphone' || deviceType === 'ipad') ? '?preview=mobile&hideScrollbars=true' : ''}`;
        iframeRef.current.src = url;
        setIsLoading(true);
      }
    }
  }, [autoNavigateTo, previewUrl, deviceType]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setPreviewUrl(origin);
      setIsLoading(false);
    }
  }, []);

  // Auto-navigate when autoNavigateTo changes
  useEffect(() => {
    if (autoNavigateTo && autoNavigateTo !== currentPath && previewUrl) {
      setCurrentPath(autoNavigateTo);
      if (iframeRef.current) {
        const url = `${previewUrl}${autoNavigateTo}${(deviceType === 'iphone' || deviceType === 'ipad') ? '?preview=mobile&hideScrollbars=true' : ''}`;
        iframeRef.current.src = url;
        setIsLoading(true);
      }
    }
  }, [autoNavigateTo, previewUrl, deviceType, currentPath]);

  useEffect(() => {
    // Calculate scale to fit container
    if (containerRef.current && visible) {
      const updateScale = () => {
        const container = containerRef.current;
        if (!container) return;
        
        const device = deviceConfigs[deviceType];
        // Account for frame padding (varies by device)
        const framePadding = deviceType === 'iphone' ? 16 : deviceType === 'ipad' ? 24 : 24;
        const containerWidth = container.clientWidth - 48; // Container padding
        const containerHeight = container.clientHeight - 48; // Container padding
        
        // Calculate available space for the frame
        const frameWidth = device.width + (framePadding * 2);
        const frameHeight = device.height + (framePadding * 2);
        
        const scaleX = containerWidth / frameWidth;
        const scaleY = containerHeight / frameHeight;
        const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
        setScale(Math.max(newScale, 0.2)); // Minimum 20% scale
      };
      
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [deviceType, visible]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
      setIsLoading(true);
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.location.href = `${previewUrl}${path}`;
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    
    // Inject CSS to hide scrollbars for mobile devices
    if ((deviceType === 'iphone' || deviceType === 'ipad') && iframeRef.current?.contentWindow) {
      try {
        const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
        if (!iframeDoc) return;
        
        // Remove any existing scrollbar styles
        const existingStyle = iframeDoc.getElementById('hide-scrollbars-style');
        if (existingStyle) existingStyle.remove();
        
        const style = iframeDoc.createElement('style');
        style.id = 'hide-scrollbars-style';
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
          }
        `;
        iframeDoc.head.appendChild(style);
        
        // Also try to set body styles directly
        if (iframeDoc.body) {
          iframeDoc.body.style.overflowX = 'hidden';
          iframeDoc.body.style.overflowY = 'auto';
          iframeDoc.body.style.setProperty('-webkit-overflow-scrolling', 'touch');
        }
      } catch (e) {
        // Cross-origin restrictions may prevent this
        console.log('Could not inject scrollbar styles (cross-origin)');
      }
    }
  };

  // Handle touch cursor for mobile previews
  useEffect(() => {
    if (deviceType !== 'iphone' && deviceType !== 'ipad') return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const cursor = document.getElementById('preview-touch-cursor');
      if (!cursor) return;

      const innerScreen = container.querySelector('.preview-touch-container') as HTMLElement;
      if (!innerScreen) return;

      const innerRect = innerScreen.getBoundingClientRect();
      
      // Check if mouse is over the inner screen
      if (
        e.clientX >= innerRect.left &&
        e.clientX <= innerRect.right &&
        e.clientY >= innerRect.top &&
        e.clientY <= innerRect.bottom
      ) {
        cursor.style.display = 'block';
        // Position relative to the inner screen container
        const x = e.clientX - innerRect.left;
        const y = e.clientY - innerRect.top;
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
      } else {
        cursor.style.display = 'none';
      }
    };

    const handleMouseLeave = () => {
      const cursor = document.getElementById('preview-touch-cursor');
      if (cursor) cursor.style.display = 'none';
    };

    const handleMouseDown = () => {
      const cursor = document.getElementById('preview-touch-cursor');
      if (cursor) {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.85)';
        cursor.style.opacity = '0.5';
      }
    };

    const handleMouseUp = () => {
      const cursor = document.getElementById('preview-touch-cursor');
      if (cursor) {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.opacity = '1';
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [deviceType]);

  if (!visible) {
    return null;
  }

  const device = deviceConfigs[deviceType];

  return (
    <div className={`flex flex-col h-full bg-slate-950 border-l border-cyan-500/20 ${className}`}>
      {/* Preview Header - Modern Design */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-cyan-500/20 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-lg shadow-red-500/20"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-lg shadow-yellow-500/20"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-lg shadow-green-500/20"></div>
            </div>
            <h3 className="text-sm font-semibold text-cyan-300 tracking-wide">Live Preview</h3>
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all"
              title="Hide Preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Device Selector */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-cyan-400/70 font-medium">Device:</span>
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 border border-cyan-500/20">
            {Object.entries(deviceConfigs).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setDeviceType(key as DeviceType)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  deviceType === key
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-cyan-300/70 hover:text-cyan-300 hover:bg-cyan-500/10'
                }`}
              >
                <span className="mr-1.5">{config.icon}</span>
                {config.name}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={currentPath}
            onChange={(e) => handleNavigate(e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-1.5 text-xs bg-slate-800/80 border border-cyan-500/30 rounded-lg text-cyan-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
          >
            <option value="/">Home</option>
            <option value="/about">About</option>
            <option value="/services">Services</option>
            <option value="/contact">Contact</option>
            <option value="/blog">Blog</option>
            <option value="/projects">Projects</option>
            <option value="/mmi-plus">MMI+</option>
            <option value="/login">Login</option>
            <option value="/dashboard">Dashboard</option>
            <option value="/profile">Profile</option>
          </select>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-200 rounded-lg transition-all flex items-center gap-1.5"
            title="Refresh preview"
          >
            <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <div className="text-xs text-cyan-400/60 px-2 py-1.5 bg-slate-800/50 rounded-lg border border-cyan-500/20">
            {Math.round(scale * 100)}%
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-cyan-300">Loading preview...</p>
            </div>
          </div>
        )}

        {/* Device Frame */}
        <div
          className={`${device.frameClass} relative transition-all duration-300 mx-auto`}
          style={{
            width: `${device.width * scale}px`,
            height: `${device.height * scale}px`,
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          {/* Preview Frame - Inner screen that fills the frame */}
          <div 
            className={`absolute bg-black overflow-hidden ${deviceType === 'iphone' || deviceType === 'ipad' ? 'preview-touch-container' : ''}`}
            style={{
              top: deviceType === 'iphone' ? '0.5rem' : deviceType === 'ipad' ? '0.75rem' : '0.5rem',
              left: deviceType === 'iphone' ? '0.5rem' : deviceType === 'ipad' ? '0.75rem' : '0.5rem',
              right: deviceType === 'iphone' ? '0.5rem' : deviceType === 'ipad' ? '0.75rem' : '0.5rem',
              bottom: deviceType === 'iphone' ? '0.5rem' : deviceType === 'ipad' ? '0.75rem' : '0.5rem',
              borderRadius: deviceType === 'iphone' ? '1.5rem' : deviceType === 'ipad' ? '1rem' : '0.5rem',
              cursor: deviceType === 'iphone' || deviceType === 'ipad' ? 'none' : 'default',
            }}
          >
            <iframe
              ref={iframeRef}
              src={`${previewUrl}${currentPath}${(deviceType === 'iphone' || deviceType === 'ipad') ? '?preview=mobile&hideScrollbars=true' : ''}`}
              className={`border-0 ${deviceType === 'iphone' || deviceType === 'ipad' ? 'preview-touch-iframe' : ''}`}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                pointerEvents: 'auto',
                border: 'none',
                margin: 0,
                padding: 0,
                overflow: 'hidden',
              }}
              title="Site Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation"
              onLoad={handleIframeLoad}
              scrolling="no"
            />
            {/* Touch cursor indicator for mobile devices */}
            {(deviceType === 'iphone' || deviceType === 'ipad') && (
              <div 
                id="preview-touch-cursor"
                className="preview-touch-cursor"
                style={{
                  display: 'none',
                  position: 'absolute',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  pointerEvents: 'none',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1000,
                  transition: 'opacity 0.1s ease',
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
