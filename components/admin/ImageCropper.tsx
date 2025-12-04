'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface AspectRatio {
  label: string;
  value: number;
  description: string;
}

export const PREDEFINED_ASPECT_RATIOS: AspectRatio[] = [
  { label: 'Content Thumbnail', value: 16 / 9, description: '16:9 - For content thumbnails' },
  { label: 'Square', value: 1, description: '1:1 - For series logos, episode thumbnails' },
  { label: 'Video Player', value: 16 / 9, description: '16:9 - Video player format' },
  { label: 'Wide Banner', value: 21 / 9, description: '21:9 - Wide format backgrounds' },
  { label: 'Traditional', value: 4 / 3, description: '4:3 - Traditional format' },
  { label: 'Portrait', value: 2 / 3, description: '2:3 - Portrait/vertical format' },
  { label: 'Free', value: 0, description: 'Free crop - No aspect ratio constraint' },
];

interface ImageCropperProps {
  image: File | string;
  aspectRatio?: number;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  image,
  aspectRatio = 16 / 9,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatio);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    const loadImage = async () => {
      let url = '';
      if (typeof image === 'string') {
        url = image;
      } else {
        url = URL.createObjectURL(image);
      }

      const img = new Image();
      img.onload = () => {
        setImageSrc(url);
        setImageSize({ width: img.width, height: img.height });
        // Center the crop
        setCrop({ x: 0, y: 0 });
      };
      img.src = url;

      return () => {
        if (typeof image !== 'string' && url) {
          URL.revokeObjectURL(url);
        }
      };
    };
    loadImage();
  }, [image]);

  const handleCrop = useCallback(() => {
    if (!canvasRef.current || !imageSrc) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Calculate crop area
      let cropWidth = containerWidth;
      let cropHeight = containerHeight;

      if (selectedAspectRatio > 0) {
        if (containerWidth / containerHeight > selectedAspectRatio) {
          cropWidth = containerHeight * selectedAspectRatio;
        } else {
          cropHeight = containerWidth / selectedAspectRatio;
        }
      }

      // Calculate scale
      const scaleX = img.width / containerWidth;
      const scaleY = img.height / containerHeight;

      // Calculate actual crop coordinates
      const cropX = (crop.x + (containerWidth - cropWidth) / 2) * scaleX;
      const cropY = (crop.y + (containerHeight - cropHeight) / 2) * scaleY;
      const cropW = cropWidth * scaleX * zoom;
      const cropH = cropHeight * scaleY * zoom;

      // Set canvas size
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      // Draw cropped image
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        cropWidth,
        cropHeight
      );

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      }, 'image/jpeg', 0.95);
    };
    img.src = imageSrc;
  }, [imageSrc, crop, zoom, selectedAspectRatio, onCropComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Crop Image</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PREDEFINED_ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.label}
                  onClick={() => setSelectedAspectRatio(ratio.value)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedAspectRatio === ratio.value
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                    {ratio.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {ratio.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Crop Area */}
          <div
            ref={containerRef}
            className="relative bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4"
            style={{
              width: '100%',
              height: '400px',
              aspectRatio: selectedAspectRatio > 0 ? selectedAspectRatio : undefined,
            }}
          >
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Crop preview"
                className="w-full h-full object-contain"
                style={{
                  transform: `translate(${crop.x}px, ${crop.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                }}
              />
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Zoom: {Math.round(zoom * 100)}%
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCrop({ x: crop.x - 10, y: crop.y })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
              >
                ← Left
              </button>
              <button
                onClick={() => setCrop({ x: crop.x + 10, y: crop.y })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
              >
                Right →
              </button>
              <button
                onClick={() => setCrop({ x: crop.x, y: crop.y - 10 })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
              >
                ↑ Up
              </button>
              <button
                onClick={() => setCrop({ x: crop.x, y: crop.y + 10 })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
              >
                ↓ Down
              </button>
            </div>
          </div>

          {/* Hidden canvas for cropping */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

