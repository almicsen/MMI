'use client';

import { useState, useRef, useEffect } from 'react';
import { uploadImage } from '@/lib/cloudinary';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onUploadComplete: (url: string) => void;
  allowCamera?: boolean;
  allowOverride?: boolean;
  userId: string;
}

export default function ProfilePhotoUpload({
  currentPhotoUrl,
  onUploadComplete,
  allowCamera = true,
  allowOverride = true,
  userId,
}: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      setUploading(true);
      setError(null);
      const url = await uploadImage(file, `mmi/users/${userId}/profile`);
      onUploadComplete(url);
      setUploading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // Front camera
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err: any) {
      setError('Camera access denied or not available');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
          stopCamera();
          await handleFileSelect(file);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Current/Preview Photo */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-cyan-500/30 shadow-lg shadow-cyan-500/20 bg-slate-800">
            {preview ? (
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {userId[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Profile Photo
          </h3>
          {allowOverride && currentPhotoUrl && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Current: Google Profile Photo
            </p>
          )}
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>
      </div>

      {/* Upload Options */}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
        >
          📁 Choose File
        </button>
        {allowCamera && (
          <>
            <button
              type="button"
              onClick={startCamera}
              disabled={uploading || showCamera}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50 text-sm font-medium shadow-lg shadow-cyan-500/20"
            >
              📷 Use Camera
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Camera Modal - Mobile Native */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 safe-area-top safe-area-bottom">
          <div className="w-full max-w-md flex flex-col h-full max-h-screen">
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
              />
            </div>
            
            <div className="mt-4 flex gap-3 safe-area-bottom">
              <button
                onClick={stopCamera}
                className="flex-1 px-6 py-4 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-xl transition-all font-medium text-lg touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 active:from-cyan-800 active:to-purple-800 text-white rounded-xl transition-all font-medium text-lg shadow-lg shadow-cyan-500/30 touch-manipulation"
              >
                📷 Capture
              </button>
            </div>
          </div>
        </div>
      )}

      {allowOverride && currentPhotoUrl && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Uploading a photo will override your Google profile photo on this site only.
        </p>
      )}
    </div>
  );
}

