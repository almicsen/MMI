/**
 * Custom MMI Audio Player for Podcasts
 */
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Content } from '@/lib/firebase/types';
import { trackView } from '@/lib/firebase/analytics';
import { useAuth } from '@/contexts/AuthContext';

interface MMIAudioPlayerProps {
  content: Content;
  onProgressUpdate?: (progress: number) => void;
  className?: string;
}

export default function MMIAudioPlayer({
  content,
  onProgressUpdate,
  className = '',
}: MMIAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchStartTime, setWatchStartTime] = useState<number | null>(null);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration);

    if (onProgressUpdate && audio.duration) {
      const progress = (audio.currentTime / audio.duration) * 100;
      onProgressUpdate(progress);
    }
  }, [onProgressUpdate]);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      setWatchStartTime(Date.now());
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (watchStartTime && audioRef.current) {
        const watchDuration = (Date.now() - watchStartTime) / 1000;
        const completed = audioRef.current.currentTime >= audioRef.current.duration * 0.95;
        trackView(content.id, user?.uid || null, watchDuration, completed);
      }
    };
  }, [watchStartTime, content.id, user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="w-12 h-12 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{content.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{content.description}</p>
        </div>
      </div>

      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer" onClick={handleSeek}>
        <div
          className="absolute h-full bg-blue-600 rounded-full"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <audio
        ref={audioRef}
        src={content.mediaUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onPlay={handlePlay}
        onPause={handlePause}
      />
    </div>
  );
}

