'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSeries } from '@/lib/firebase/firestore';
import { Series } from '@/lib/firebase/types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { uploadVideo } from '@/lib/cloudinary';
import { useToast } from '@/contexts/ToastContext';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [series, setSeries] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    episodeNumber: '',
    seasonNumber: '',
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const data = await getSeries();
        // Filter series where user has write permission
        const accessibleSeries = data.filter(
          (s) => user?.permissions?.[s.id] === 'write' || user?.role === 'admin'
        );
        setSeries(accessibleSeries);
      } catch (error) {
        console.error('Error loading series:', error);
      }
    };
    if (user) {
      loadSeries();
    }
  }, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile || !selectedSeries) return;

    setUploading(true);
    try {
      const mediaUrl = await uploadVideo(mediaFile, 'mmi/employee-uploads');

      const content = {
        type: 'series' as const,
        title: formData.title,
        description: formData.description,
        mediaUrl,
        seriesId: selectedSeries,
        episodeNumber: formData.episodeNumber ? parseInt(formData.episodeNumber) : undefined,
        seasonNumber: formData.seasonNumber ? parseInt(formData.seasonNumber) : undefined,
        published: false,
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      };

      await addDoc(collection(db, 'pendingUploads'), {
        contentId: '',
        seriesId: selectedSeries,
        uploadedBy: user!.uid,
        status: 'pending',
        createdAt: new Date() as any,
        contentData: content,
      });

      toast.showSuccess('Upload submitted for approval!');
      setFormData({ title: '', description: '', episodeNumber: '', seasonNumber: '' });
      setMediaFile(null);
    } catch (error) {
      console.error('Error uploading:', error);
      toast.showError('Error uploading content');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Employee Dashboard</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          Upload Content
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Series
            </label>
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Select a series</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Episode Number
              </label>
              <input
                type="number"
                value={formData.episodeNumber}
                onChange={(e) => setFormData({ ...formData, episodeNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Season Number
              </label>
              <input
                type="number"
                value={formData.seasonNumber}
                onChange={(e) => setFormData({ ...formData, seasonNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Media File
            </label>
            <input
              type="file"
              required
              accept="video/*,audio/*"
              onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Submit for Approval'}
          </button>
        </form>
      </div>
    </div>
  );
}

