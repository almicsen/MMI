'use client';

import { useState, useEffect } from 'react';
import ImageCropper, { PREDEFINED_ASPECT_RATIOS } from './ImageCropper';

interface UploadPreviewProps {
  file: File | null;
  type: 'image' | 'video';
  onCrop?: (croppedBlob: Blob) => void;
  showCrop?: boolean;
  defaultAspectRatio?: number;
}

export default function UploadPreview({
  file,
  type,
  onCrop,
  showCrop = true,
  defaultAspectRatio,
}: UploadPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showCropper, setShowCropper] = useState(false);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }

    if (type === 'image') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (type === 'video') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, type]);

  const handleCropComplete = (blob: Blob) => {
    setCroppedBlob(blob);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setShowCropper(false);
    if (onCrop) {
      onCrop(blob);
    }
  };

  if (!file) return null;

  return (
    <>
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</h3>
          {type === 'image' && showCrop && (
            <button
              onClick={() => setShowCropper(true)}
              className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              ✂️ Crop Image
            </button>
          )}
        </div>

        {type === 'image' && previewUrl && (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          </div>
        )}

        {type === 'video' && previewUrl && (
          <div className="relative">
            <video
              src={previewUrl}
              controls
              className="max-w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
            />
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          </div>
        )}
      </div>

      {showCropper && file && type === 'image' && (
        <ImageCropper
          image={file}
          aspectRatio={defaultAspectRatio}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </>
  );
}

