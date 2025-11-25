/**
 * Intro Injector Component
 * Automatically injects MMI+ intro for original content
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Content, ContentPlayerConfig } from '@/lib/firebase/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface IntroInjectorProps {
  content: Content;
  config?: ContentPlayerConfig;
  mediaElement: HTMLVideoElement | HTMLAudioElement | null;
  onIntroComplete?: () => void;
}

export default function IntroInjector({
  content,
  config,
  mediaElement,
  onIntroComplete,
}: IntroInjectorProps) {
  const [introUrl, setIntroUrl] = useState<string | null>(null);
  const [introDuration, setIntroDuration] = useState(0);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const introMediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const originalSrcRef = useRef<string | null>(null);
  const originalCurrentTimeRef = useRef<number>(0);

  useEffect(() => {
    const loadIntroSettings = async () => {
      if (!content.isMMIOriginal) return;

      try {
        // Try to get intro from config first
        if (config) {
          if (content.type === 'series' || content.type === 'movie') {
            if (config.videoIntroUrl) {
              setIntroUrl(config.videoIntroUrl);
              setIntroDuration(config.introDuration || 5);
              return;
            }
          } else if (content.type === 'podcast' || content.type === 'audiobook') {
            if (config.audioIntroUrl) {
              setIntroUrl(config.audioIntroUrl);
              setIntroDuration(config.introDuration || 5);
              return;
            }
          }
        }

        // Fallback to global intro settings
        const globalConfig = await getDoc(doc(db, 'config', 'mmiPlusIntros'));
        if (globalConfig.exists()) {
          const data = globalConfig.data();
          if (content.type === 'series' || content.type === 'movie') {
            if (data.videoIntroUrl) {
              setIntroUrl(data.videoIntroUrl);
              setIntroDuration(5); // Default 5 seconds
            }
          } else if (content.type === 'podcast' || content.type === 'audiobook') {
            if (data.audioIntroUrl) {
              setIntroUrl(data.audioIntroUrl);
              setIntroDuration(5); // Default 5 seconds
            }
          }
        }
      } catch (error) {
        console.error('Error loading intro settings:', error);
      }
    };

    loadIntroSettings();
  }, [content, config]);

  useEffect(() => {
    if (!introUrl || !mediaElement || hasPlayedIntro) return;

    const playIntro = async () => {
      // Store original source and time
      originalSrcRef.current = mediaElement.src;
      originalCurrentTimeRef.current = mediaElement.currentTime;

      // Create intro media element
      if (content.type === 'series' || content.type === 'movie') {
        const introVideo = document.createElement('video');
        introVideo.src = introUrl;
        introVideo.muted = false;
        introVideo.style.position = 'absolute';
        introVideo.style.top = '0';
        introVideo.style.left = '0';
        introVideo.style.width = '100%';
        introVideo.style.height = '100%';
        introVideo.style.zIndex = '1000';
        introVideo.style.objectFit = 'cover';
        
        // Insert before the main video
        if (mediaElement.parentElement) {
          mediaElement.parentElement.style.position = 'relative';
          mediaElement.parentElement.appendChild(introVideo);
        }

        introMediaRef.current = introVideo;

        // Play intro
        try {
          await introVideo.play();
          
          introVideo.onended = () => {
            // Remove intro element
            if (introVideo.parentElement) {
              introVideo.parentElement.removeChild(introVideo);
            }
            
            // Restore original media
            if (originalSrcRef.current) {
              mediaElement.src = originalSrcRef.current;
            }
            
            setHasPlayedIntro(true);
            if (onIntroComplete) {
              onIntroComplete();
            }
          };
        } catch (error) {
          console.error('Error playing intro:', error);
          // If intro fails, just continue with main content
          setHasPlayedIntro(true);
          if (onIntroComplete) {
            onIntroComplete();
          }
        }
      } else if (content.type === 'podcast' || content.type === 'audiobook') {
        // For audio, we'll play the intro audio first, then the main audio
        const introAudio = document.createElement('audio');
        introAudio.src = introUrl;
        introMediaRef.current = introAudio;

        // Pause main audio
        mediaElement.pause();

        try {
          await introAudio.play();
          
          introAudio.onended = () => {
            // Resume main audio
            mediaElement.play();
            setHasPlayedIntro(true);
            if (onIntroComplete) {
              onIntroComplete();
            }
          };
        } catch (error) {
          console.error('Error playing audio intro:', error);
          // If intro fails, just continue with main content
          mediaElement.play();
          setHasPlayedIntro(true);
          if (onIntroComplete) {
            onIntroComplete();
          }
        }
      }
    };

    // Only play intro when media is about to play
    const handlePlay = () => {
      if (!hasPlayedIntro && introUrl) {
        playIntro();
      }
    };

    mediaElement.addEventListener('play', handlePlay);

    return () => {
      mediaElement.removeEventListener('play', handlePlay);
      // Cleanup intro media if component unmounts
      if (introMediaRef.current) {
        if (introMediaRef.current instanceof HTMLVideoElement) {
          introMediaRef.current.pause();
          if (introMediaRef.current.parentElement) {
            introMediaRef.current.parentElement.removeChild(introMediaRef.current);
          }
        } else if (introMediaRef.current instanceof HTMLAudioElement) {
          introMediaRef.current.pause();
        }
      }
    };
  }, [introUrl, mediaElement, hasPlayedIntro, content, onIntroComplete]);

  return null; // This component doesn't render anything
}

