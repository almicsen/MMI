/**
 * Video Timeline Editor
 * Allows frame-precise selection of skip intro/recap times
 */
'use client';

import { useRef, useEffect, useState } from 'react';
import { Content } from '@/lib/firebase/types';

interface VideoTimelineEditorProps {
  content: Content;
  onTimeSelect: (startTime: number, endTime: number) => void;
  initialStartTime?: number;
  initialEndTime?: number;
}

export default function VideoTimelineEditor({
  content,
  onTimeSelect,
  initialStartTime = 0,
  initialEndTime = 0,
}: VideoTimelineEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  }, [content.mediaUrl]);

  const handleTimeUpdate = () => {
    if (videoRef.current && !scrubbing) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    handleSeek(time);
  };

  const setStartMarker = () => {
    setStartTime(currentTime);
    onTimeSelect(currentTime, endTime);
  };

  const setEndMarker = () => {
    setEndTime(currentTime);
    onTimeSelect(startTime, currentTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps
    return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const formatTimeSimple = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={content.mediaUrl}
          className="w-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Timeline with markers */}
        <div className="bg-gray-800 p-4">
          <div
            className="relative h-16 bg-gray-700 rounded cursor-pointer"
            onClick={handleTimelineClick}
            onMouseDown={() => setScrubbing(true)}
            onMouseUp={() => setScrubbing(false)}
          >
            {/* Progress bar */}
            <div
              className="absolute h-full bg-blue-600 opacity-50"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />

            {/* Start marker */}
            {startTime > 0 && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-green-500 cursor-pointer z-10"
                style={{ left: `${(startTime / duration) * 100}%` }}
                title={`Start: ${formatTimeSimple(startTime)}`}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-green-400 whitespace-nowrap">
                  START
                </div>
              </div>
            )}

            {/* End marker */}
            {endTime > 0 && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-red-500 cursor-pointer z-10"
                style={{ left: `${(endTime / duration) * 100}%` }}
                title={`End: ${formatTimeSimple(endTime)}`}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-red-400 whitespace-nowrap">
                  END
                </div>
              </div>
            )}

            {/* Selected range highlight */}
            {startTime > 0 && endTime > 0 && (
              <div
                className="absolute h-full bg-yellow-500 opacity-30"
                style={{
                  left: `${(startTime / duration) * 100}%`,
                  width: `${((endTime - startTime) / duration) * 100}%`,
                }}
              />
            )}

            {/* Current time indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white z-20"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black px-2 py-1 rounded whitespace-nowrap">
                {formatTime(currentTime)}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) {
                      videoRef.current.pause();
                    } else {
                      videoRef.current.play();
                    }
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                onClick={() => handleSeek(Math.max(0, currentTime - 1))}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                ⏪ -1s
              </button>
              <button
                onClick={() => handleSeek(Math.min(duration, currentTime + 1))}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                +1s ⏩
              </button>
              <button
                onClick={() => handleSeek(Math.max(0, currentTime - 0.033))}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                title="Frame back (30fps)"
              >
                ⏪ -1f
              </button>
              <button
                onClick={() => handleSeek(Math.min(duration, currentTime + 0.033))}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                title="Frame forward (30fps)"
              >
                +1f ⏩
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={setStartMarker}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Set Start ({formatTimeSimple(startTime)})
              </button>
              <button
                onClick={setEndMarker}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Set End ({formatTimeSimple(endTime)})
              </button>
            </div>

            <div className="text-sm text-gray-300">
              {formatTimeSimple(currentTime)} / {formatTimeSimple(duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Time display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Start Time (seconds)
            </label>
            <input
              type="number"
              step="0.033"
              value={startTime.toFixed(3)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setStartTime(val);
                onTimeSelect(val, endTime);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">{formatTime(startTime)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              End Time (seconds)
            </label>
            <input
              type="number"
              step="0.033"
              value={endTime.toFixed(3)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setEndTime(val);
                onTimeSelect(startTime, val);
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">{formatTime(endTime)}</p>
          </div>
        </div>
        {startTime > 0 && endTime > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Duration: <strong>{formatTimeSimple(endTime - startTime)}</strong> (
              {(endTime - startTime).toFixed(3)} seconds)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

