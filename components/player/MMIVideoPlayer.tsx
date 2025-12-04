/**
 * Custom MMI Video Player
 * Features: Skip Intro, Skip Recap, X-Ray Insights
 */
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Content, ContentPlayerConfig, XRayData, CustomButton } from '@/lib/firebase/types';
import { trackView } from '@/lib/firebase/analytics';
import { useAuth } from '@/contexts/AuthContext';
import { getNextEpisode } from '@/lib/firebase/userRecommendations';
import MiniPlayer from './MiniPlayer';
import IntroInjector from './IntroInjector';

interface MMIVideoPlayerProps {
  content: Content;
  config?: ContentPlayerConfig;
  onProgressUpdate?: (progress: number) => void;
  className?: string;
}

export default function MMIVideoPlayer({
  content,
  config,
  onProgressUpdate,
  className = '',
}: MMIVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showSkipRecap, setShowSkipRecap] = useState(false);
  const [currentXRay, setCurrentXRay] = useState<XRayData | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [watchStartTime, setWatchStartTime] = useState<number | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showCustomButtons, setShowCustomButtons] = useState<CustomButton[]>([]);
  const [showAutoPlayCountdown, setShowAutoPlayCountdown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [nextContent, setNextContent] = useState<Content | null>(null);
  const router = useRouter();
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Load next episode
  useEffect(() => {
    const loadNextEpisode = async () => {
      if (content.seriesId && content.episodeNumber) {
        const next = await getNextEpisode(content);
        setNextContent(next);
      }
    };
    loadNextEpisode();
  }, [content]);

  // Check for skip intro/recap and custom buttons
  useEffect(() => {
    if (!videoRef.current || !config) return;

    const video = videoRef.current;
    const checkSkipButtons = () => {
      const time = video.currentTime;

      // Check skip intro
      if (config.skipIntro?.enabled) {
        const { startTime, endTime } = config.skipIntro;
        if (time >= startTime && time <= endTime) {
          setShowSkipIntro(true);
        } else {
          setShowSkipIntro(false);
        }
      }

      // Check skip recap
      if (config.skipRecap?.enabled) {
        const { startTime, endTime } = config.skipRecap;
        if (time >= startTime && time <= endTime) {
          setShowSkipRecap(true);
        } else {
          setShowSkipRecap(false);
        }
      }

      // Check custom buttons
      if (config.customButtons && config.customButtons.length > 0) {
        const activeButtons = config.customButtons.filter(
          (btn) => time >= btn.startTime && time <= btn.endTime
        );
        setShowCustomButtons(activeButtons);
      }

      // Check X-Ray data
      if (config.xRayEnabled && config.xRayData) {
        const activeXRay = config.xRayData.find(
          (xray) => Math.abs(xray.timestamp - time) < 3 // Show within 3 seconds
        );
        setCurrentXRay(activeXRay || null);
      }
    };

    video.addEventListener('timeupdate', checkSkipButtons);
    return () => video.removeEventListener('timeupdate', checkSkipButtons);
  }, [config]);

  // Handle video end
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const handleEnded = () => {
      if (config?.autoPlayNext?.enabled && nextContent) {
        // Start countdown
        setShowAutoPlayCountdown(true);
        setCountdown(config.autoPlayNext.countdownSeconds || 10);

        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              router.push(`/mmi-plus/${nextContent.id}`);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        countdownRef.current = interval as any;
      } else {
        // Show mini player with recommendations
        setShowMiniPlayer(true);
      }
    };

    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('ended', handleEnded);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [config, nextContent, router]);

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000) as any;
    } else {
      setShowControls(true);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    };
  }, [isPlaying]);

  const handleSkipIntro = () => {
    if (videoRef.current && config?.skipIntro) {
      videoRef.current.currentTime = config.skipIntro.endTime;
      setShowSkipIntro(false);
    }
  };

  const handleSkipRecap = () => {
    if (videoRef.current && config?.skipRecap) {
      videoRef.current.currentTime = config.skipRecap.endTime;
      setShowSkipRecap(false);
    }
  };

  const handleCustomButton = async (button: CustomButton) => {
    if (!videoRef.current) return;

    if (button.action === 'skip' && button.actionData?.skipToTime !== undefined) {
      videoRef.current.currentTime = button.actionData.skipToTime;
    } else if (button.action === 'next-episode' && nextContent) {
      router.push(`/mmi-plus/${nextContent.id}`);
    }
  };

  const handleCancelAutoPlay = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setShowAutoPlayCountdown(false);
    setShowMiniPlayer(true);
  };

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    setCurrentTime(video.currentTime);
    setDuration(video.duration);

    // Update progress
    if (onProgressUpdate && video.duration) {
      const progress = (video.currentTime / video.duration) * 100;
      onProgressUpdate(progress);
    }
  }, [onProgressUpdate]);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      setWatchStartTime(Date.now());
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Track view on unmount or completion
  useEffect(() => {
    return () => {
      if (watchStartTime && videoRef.current) {
        const watchDuration = (Date.now() - watchStartTime) / 1000;
        const completed = videoRef.current.currentTime >= videoRef.current.duration * 0.95;
        trackView(content.id, user?.uid || null, watchDuration, completed);
      }
    };
  }, [watchStartTime, content.id, user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseMove={() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
          controlsTimeoutRef.current = null;
        }
      }}
      onMouseLeave={() => {
        if (isPlaying) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 2000) as any;
        }
      }}
    >
      <video
        ref={videoRef}
        src={content.mediaUrl}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        onPlay={handlePlay}
        onPause={handlePause}
        onClick={(e) => {
          e.stopPropagation();
          if (isPlaying) {
            handlePause();
          } else {
            handlePlay();
          }
        }}
      />

      {/* Skip Intro Button */}
      {showSkipIntro && config?.skipIntro?.enabled && (
        <button
          onClick={handleSkipIntro}
          className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg hover:bg-black/90 transition-colors z-10 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Skip Intro
        </button>
      )}

      {/* Skip Recap Button */}
      {showSkipRecap && config?.skipRecap?.enabled && (
        <button
          onClick={handleSkipRecap}
          className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg hover:bg-black/90 transition-colors z-10 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Skip Recap
        </button>
      )}

      {/* Custom Buttons */}
      {showCustomButtons.map((button, index) => (
        <button
          key={button.id}
          onClick={() => handleCustomButton(button)}
          className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg hover:bg-black/90 transition-colors z-10 flex items-center gap-2"
          style={{ top: `${4 + index * 60}px` }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {button.label}
        </button>
      ))}

      {/* Auto-play Countdown */}
      {showAutoPlayCountdown && nextContent && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Up Next: {nextContent.title}</h3>
            <div className="text-6xl font-bold text-white mb-4">{countdown}</div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleCancelAutoPlay}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push(`/mmi-plus/${nextContent.id}`)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Play Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* X-Ray Overlay */}
      {currentXRay && config?.xRayEnabled && (
        <div className="absolute bottom-20 left-4 bg-black/90 text-white p-4 rounded-lg max-w-sm z-10 animate-in fade-in slide-in-from-bottom-4">
          {currentXRay.imageUrl && (
            <img
              src={currentXRay.imageUrl}
              alt={currentXRay.title}
              className="w-16 h-16 rounded-full object-cover mb-2"
            />
          )}
          <h4 className="font-semibold mb-1">{currentXRay.title}</h4>
          {currentXRay.metadata?.role && (
            <p className="text-sm text-gray-300">{currentXRay.metadata.role}</p>
          )}
          {currentXRay.metadata?.character && (
            <p className="text-sm text-gray-400">as {currentXRay.metadata.character}</p>
          )}
          {currentXRay.description && (
            <p className="text-sm text-gray-300 mt-2">{currentXRay.description}</p>
          )}
        </div>
      )}

      {/* Custom Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPlaying) handlePause();
                else handlePlay();
              }}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="flex-1">
            <div
              className="relative h-2 bg-white/20 rounded-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (videoRef.current && duration > 0) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  videoRef.current.currentTime = percentage * duration;
                }
              }}
            >
                <div
                  className="absolute h-full bg-blue-600 rounded-full"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      )}

      {/* Mini Player with Recommendations */}
      {showMiniPlayer && (
        <MiniPlayer currentContent={content} onClose={() => setShowMiniPlayer(false)} />
      )}
    </div>
  );
}

