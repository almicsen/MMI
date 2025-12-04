/**
 * Trailer Player Component
 * Shows trailer/sample before main content
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { Content } from '@/lib/firebase/types';

interface TrailerPlayerProps {
  content: Content;
  onTrailerComplete: () => void;
  onSkip?: () => void;
}

export default function TrailerPlayer({ content, onTrailerComplete, onSkip }: TrailerPlayerProps) {
  const [showTrailer, setShowTrailer] = useState(!!content.trailerUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!content.trailerUrl) {
      onTrailerComplete();
      return;
    }
  }, [content.trailerUrl, onTrailerComplete]);

  const handlePlay = () => {
    setIsPlaying(true);
    if (content.trailerType === 'video' && videoRef.current) {
      videoRef.current.play();
    } else if (content.trailerType === 'audio' && audioRef.current) {
      audioRef.current.play();
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (content.trailerType === 'video' && videoRef.current) {
      videoRef.current.pause();
    } else if (content.trailerType === 'audio' && audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleEnded = () => {
    setShowTrailer(false);
    onTrailerComplete();
  };

  const handleSkip = () => {
    setShowTrailer(false);
    if (onSkip) {
      onSkip();
    }
    onTrailerComplete();
  };

  if (!showTrailer || !content.trailerUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full h-full max-w-7xl mx-auto">
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 px-4 py-2 bg-black/70 text-white rounded-lg hover:bg-black/90 transition-colors flex items-center gap-2"
        >
          <span>Skip</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Trailer Label */}
        <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-black/70 text-white rounded-lg">
          {content.type === 'audiobook' ? 'Audiobook Sample' : 
           content.type === 'podcast' ? 'Podcast Trailer' : 
           'Trailer'}
        </div>

        {/* Video Trailer */}
        {content.trailerType === 'video' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              src={content.trailerUrl}
              className="w-full h-full object-contain"
              onEnded={handleEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              autoPlay
            />
            {!isPlaying && (
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Audio Trailer */}
        {content.trailerType === 'audio' && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{content.title}</h3>
                <p className="text-white/70 text-sm">
                  {content.type === 'audiobook' ? 'Audiobook Sample' : 'Podcast Trailer'}
                </p>
              </div>
              
              {content.thumbnailUrl && (
                <div className="mb-6">
                  <img
                    src={content.thumbnailUrl}
                    alt={content.title}
                    className="w-full rounded-lg shadow-2xl"
                  />
                </div>
              )}

              <div className="space-y-4">
                <audio
                  ref={audioRef}
                  src={content.trailerUrl}
                  onEnded={handleEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  autoPlay
                  className="w-full"
                />
                
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={isPlaying ? handlePause : handlePlay}
                    className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? (
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

