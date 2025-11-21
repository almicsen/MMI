/**
 * Cloudinary Upload Utility
 * Handles direct uploads from browser to Cloudinary
 */

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: 'image' | 'video' | 'raw';
}

/**
 * Upload file to Cloudinary
 * @param file - File to upload
 * @param folder - Optional folder path in Cloudinary
 * @param resourceType - 'image' or 'video'
 * @returns Upload result with secure URL
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'mmi',
  resourceType: 'image' | 'video' | 'auto' = 'auto'
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary configuration missing. Please check your environment variables. ' +
      `Cloud name: ${cloudName ? '✓' : '✗'}, Upload preset: ${uploadPreset ? '✓' : '✗'}`
    );
  }

  // Determine resource type if auto
  if (resourceType === 'auto') {
    if (file.type.startsWith('image/')) {
      resourceType = 'image';
    } else if (file.type.startsWith('video/')) {
      resourceType = 'video';
    } else {
      throw new Error('Unsupported file type. Please upload an image or video.');
    }
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  // Add optimization settings
  if (resourceType === 'image') {
    formData.append('transformation', 'f_auto,q_auto'); // Auto format, auto quality
  } else if (resourceType === 'video') {
    formData.append('transformation', 'f_auto,q_auto'); // Auto format, auto quality
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      resource_type: resourceType,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.message || 'Failed to upload file to Cloudinary');
  }
}

/**
 * Upload image to Cloudinary
 */
export async function uploadImage(
  file: File,
  folder: string = 'mmi/images'
): Promise<string> {
  const result = await uploadToCloudinary(file, folder, 'image');
  return result.secure_url;
}

/**
 * Upload video to Cloudinary
 */
export async function uploadVideo(
  file: File,
  folder: string = 'mmi/videos'
): Promise<string> {
  const result = await uploadToCloudinary(file, folder, 'video');
  return result.secure_url;
}

/**
 * Delete file from Cloudinary (requires server-side implementation)
 * Note: This requires API secret, so should be done server-side
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  // This would need to be implemented server-side for security
  // Client-side deletion requires exposing API secret (not recommended)
  console.warn('Delete from Cloudinary should be done server-side');
}

