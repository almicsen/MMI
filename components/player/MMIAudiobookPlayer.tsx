/**
 * Custom MMI Audiobook Player with Chapter Navigation and EPUB Sync
 */
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Content, AudiobookChapter } from '@/lib/firebase/types';
import { trackView } from '@/lib/firebase/analytics';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface MMIAudiobookPlayerProps {
  content: Content;
  onProgressUpdate?: (progress: number) => void;
  className?: string;
}

export default function MMIAudiobookPlayer({
  content,
  onProgressUpdate,
  className = '',
}: MMIAudiobookPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchStartTime, setWatchStartTime] = useState<number | null>(null);
  const [currentChapter, setCurrentChapter] = useState<AudiobookChapter | null>(null);
  const [chapters, setChapters] = useState<AudiobookChapter[]>(content.chapters || []);
  const [showChapters, setShowChapters] = useState(false);
  const [showBookReader, setShowBookReader] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!user || !content.id) return;
      
      try {
        const progressDoc = await getDoc(doc(db, 'userProgress', `${user.uid}_${content.id}`));
        if (progressDoc.exists()) {
          const progress = progressDoc.data();
          if (progress.progress > 0 && audioRef.current) {
            const savedTime = (progress.progress / 100) * duration;
            if (savedTime > 0 && savedTime < duration) {
              audioRef.current.currentTime = savedTime;
            }
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    if (duration > 0) {
      loadProgress();
    }
  }, [user, content.id, duration]);

  // Update current chapter based on time
  useEffect(() => {
    if (chapters.length === 0) return;
    
    const chapter = chapters.find(
      (ch) => currentTime >= ch.startTime && (ch.endTime ? currentTime < ch.endTime : true)
    ) || chapters[chapters.length - 1];
    
    if (chapter && chapter.id !== currentChapter?.id) {
      setCurrentChapter(chapter);
      // Sync to book page if available
      if (chapter.pageNumber) {
        setCurrentPage(chapter.pageNumber);
      }
    }
  }, [currentTime, chapters, currentChapter]);

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

  // Save progress
  const saveProgress = useCallback(async () => {
    if (!user || !content.id || !audioRef.current || !duration) return;
    
    try {
      const progress = (currentTime / duration) * 100;
      await updateDoc(doc(db, 'userProgress', `${user.uid}_${content.id}`), {
        contentId: content.id,
        userId: user.uid,
        progress,
        currentTime,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [user, content.id, currentTime, duration]);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        saveProgress();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, saveProgress]);

  useEffect(() => {
    return () => {
      if (watchStartTime && audioRef.current) {
        const watchDuration = (Date.now() - watchStartTime) / 1000;
        const completed = audioRef.current.currentTime >= audioRef.current.duration * 0.95;
        trackView(content.id, user?.uid || null, watchDuration, completed);
        saveProgress();
      }
    };
  }, [watchStartTime, content.id, user, saveProgress]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
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

  const jumpToChapter = (chapter: AudiobookChapter) => {
    if (audioRef.current) {
      audioRef.current.currentTime = chapter.startTime;
      setCurrentChapter(chapter);
      if (chapter.pageNumber) {
        setCurrentPage(chapter.pageNumber);
      }
    }
  };

  const jumpToNextChapter = () => {
    if (!currentChapter || chapters.length === 0) return;
    const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
    if (currentIndex < chapters.length - 1) {
      jumpToChapter(chapters[currentIndex + 1]);
    }
  };

  const jumpToPreviousChapter = () => {
    if (!currentChapter || chapters.length === 0) return;
    const currentIndex = chapters.findIndex(ch => ch.id === currentChapter.id);
    if (currentIndex > 0) {
      jumpToChapter(chapters[currentIndex - 1]);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Chapter Navigation */}
      {chapters.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">Current Chapter</h4>
            <button
              onClick={() => setShowChapters(!showChapters)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showChapters ? 'Hide' : 'Show'} Chapters
            </button>
          </div>
          {currentChapter && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-2">
              <h5 className="font-medium text-gray-900 dark:text-white">{currentChapter.title}</h5>
              {currentChapter.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{currentChapter.description}</p>
              )}
            </div>
          )}
          {showChapters && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => jumpToChapter(chapter)}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                    currentChapter?.id === chapter.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{chapter.title}</span>
                    <span className="text-sm opacity-75">{formatTime(chapter.startTime)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Book Reader Toggle */}
      {content.bookFileUrl && (
        <div className="mb-4">
          <button
            onClick={() => setShowBookReader(!showBookReader)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            {showBookReader ? 'Hide' : 'Show'} Book Reader
          </button>
        </div>
      )}

      {/* Book Reader */}
      {showBookReader && content.bookFileUrl && (
        <div className="mb-4 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">Book Reader</h4>
            <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage}</span>
          </div>
          <div className="h-96 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 p-4 overflow-y-auto">
            <p className="text-gray-600 dark:text-gray-400 text-center">
              EPUB reader will be integrated here. Current chapter: {currentChapter?.title || 'N/A'}
            </p>
            {/* EPUB.js integration will go here */}
          </div>
        </div>
      )}

      {/* Audio Controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={jumpToPreviousChapter}
          disabled={!currentChapter || chapters.findIndex(ch => ch.id === currentChapter.id) === 0}
          className="w-10 h-10 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous Chapter"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
        
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

        <button
          onClick={jumpToNextChapter}
          disabled={!currentChapter || chapters.findIndex(ch => ch.id === currentChapter.id) === chapters.length - 1}
          className="w-10 h-10 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next Chapter"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
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

