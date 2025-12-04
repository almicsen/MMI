/**
 * CDN Upload Tracking and Management
 * Tracks all uploads to Cloudinary/CDN with logs
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './config';

export interface CDNUpload {
  id?: string;
  url: string;
  publicId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  folder: string;
  uploadedBy: string;
  uploadedAt: Date;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    duration?: number; // For videos
  };
}

/**
 * Log a CDN upload
 */
export async function logCDNUpload(
  upload: Omit<CDNUpload, 'id' | 'uploadedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'cdnUploads'), {
      ...upload,
      uploadedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error logging CDN upload:', error);
    throw error;
  }
}

/**
 * Get all CDN uploads
 */
export async function getCDNUploads(
  limitCount: number = 100,
  folder?: string,
  uploadedBy?: string
): Promise<CDNUpload[]> {
  try {
    let q = query(
      collection(db, 'cdnUploads'),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    );

    if (folder) {
      q = query(q, where('folder', '==', folder));
    }

    if (uploadedBy) {
      q = query(q, where('uploadedBy', '==', uploadedBy));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt),
      } as CDNUpload;
    });
  } catch (error) {
    console.error('Error fetching CDN uploads:', error);
    return [];
  }
}

/**
 * Get upload statistics
 */
export async function getCDNStats(): Promise<{
  totalUploads: number;
  totalSize: number;
  byType: Record<string, number>;
  byFolder: Record<string, number>;
}> {
  try {
    const uploads = await getCDNUploads(10000);
    const stats = {
      totalUploads: uploads.length,
      totalSize: 0,
      byType: {} as Record<string, number>,
      byFolder: {} as Record<string, number>,
    };

    uploads.forEach((upload) => {
      stats.totalSize += upload.fileSize;
      stats.byType[upload.fileType] = (stats.byType[upload.fileType] || 0) + 1;
      stats.byFolder[upload.folder] = (stats.byFolder[upload.folder] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting CDN stats:', error);
    return {
      totalUploads: 0,
      totalSize: 0,
      byType: {},
      byFolder: {},
    };
  }
}

