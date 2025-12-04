'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ComingSoonContent } from '@/lib/firebase/types';
import { uploadImage, uploadVideo } from '@/lib/cloudinary';
import { useToast } from '@/contexts/ToastContext';

interface TrailerInput {
  file: File | null;
  url: string;
}

export default function ComingSoonManager() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    type: 'series' as 'series' | 'movie' | 'podcast',
    title: '',
    description: '',
    thumbnailUrl: '',
    releaseDate: '',
    episodeCount: 0,
  });
  const [trailers, setTrailers] = useState<TrailerInput[]>([
    { file: null, url: '' },
  ]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [comingSoonList, setComingSoonList] = useState<ComingSoonContent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load existing Coming Soon content
  const loadComingSoon = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'comingSoon'));
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          trailers: data.trailers || (data.trailerUrl ? [data.trailerUrl] : []), // Migrate old format
        } as ComingSoonContent;
      });
      setComingSoonList(list);
    } catch (error) {
      console.error('Error loading coming soon:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComingSoon();
  }, []);

  const handleFileUpload = async (file: File, type: 'image' | 'video'): Promise<string> => {
    if (type === 'image') {
      return await uploadImage(file, 'mmi/coming-soon/thumbnails');
    } else {
      return await uploadVideo(file, 'mmi/coming-soon/trailers');
    }
  };

  const addTrailerSlot = () => {
    if (trailers.length < 4) {
      setTrailers([...trailers, { file: null, url: '' }]);
    }
  };

  const removeTrailerSlot = (index: number) => {
    setTrailers(trailers.filter((_, i) => i !== index));
  };

  const updateTrailer = (index: number, field: 'file' | 'url', value: File | null | string) => {
    const updated = [...trailers];
    updated[index] = { ...updated[index], [field]: value };
    setTrailers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let thumbnailUrl = formData.thumbnailUrl;

      if (thumbnailFile) {
        thumbnailUrl = await handleFileUpload(thumbnailFile, 'image');
      }

      // Upload all trailers
      const trailerUrls: string[] = [];
      for (const trailer of trailers) {
        if (trailer.file) {
          const url = await handleFileUpload(trailer.file, 'video');
          trailerUrls.push(url);
        } else if (trailer.url.trim()) {
          trailerUrls.push(trailer.url.trim());
        }
      }

      if (trailerUrls.length === 0) {
        toast.showWarning('Please add at least one trailer');
        setUploading(false);
        return;
      }

      const comingSoon: Omit<ComingSoonContent, 'id'> = {
        ...formData,
        thumbnailUrl: thumbnailUrl || undefined,
        trailers: trailerUrls,
        notifySubscribers: [],
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      };

      await addDoc(collection(db, 'comingSoon'), comingSoon);
      
      toast.showSuccess('Coming Soon content created successfully!');
      setFormData({
        type: 'series',
        title: '',
        description: '',
        thumbnailUrl: '',
        releaseDate: '',
        episodeCount: 0,
      });
      setTrailers([{ file: null, url: '' }]);
      setThumbnailFile(null);
      loadComingSoon();
    } catch (error) {
      console.error('Error creating coming soon content:', error);
      toast.showError('Error creating content');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await toast.confirm(
      'Are you sure you want to delete this Coming Soon item?',
      {
        title: 'Delete Coming Soon Item',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
      }
    );
    
    if (!confirmed) return;
    
    try {
      await deleteDoc(doc(db, 'comingSoon', id));
      loadComingSoon();
      toast.showSuccess('Deleted successfully');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.showError('Error deleting content');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Coming Soon Content</h2>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="series">Series</option>
              <option value="movie">Movie</option>
              <option value="podcast">Podcast</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Title *
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
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Thumbnail
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              type="url"
              placeholder="Or enter thumbnail URL"
              value={formData.thumbnailUrl}
              onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Trailers/Promo Videos (up to 4) *
              </label>
              {trailers.length < 4 && (
                <button
                  type="button"
                  onClick={addTrailerSlot}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Add Trailer
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
              Add up to 4 trailers or promo videos for this Coming Soon content
            </p>
            {trailers.map((trailer, index) => (
              <div key={index} className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trailer {index + 1}
                  </span>
                  {trailers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTrailerSlot(index)}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => updateTrailer(index, 'file', e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-2"
                />
                <input
                  type="url"
                  placeholder="Or enter trailer video URL"
                  value={trailer.url}
                  onChange={(e) => updateTrailer(index, 'url', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Release Date *
            </label>
            <input
              type="date"
              required
              value={formData.releaseDate}
              onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Episode Count (for series)
            </label>
            <input
              type="number"
              min="0"
              value={formData.episodeCount}
              onChange={(e) => setFormData({ ...formData, episodeCount: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {uploading ? 'Creating...' : 'Create Coming Soon Content'}
          </button>
        </form>
      </div>

      {/* List of Coming Soon Content */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Existing Coming Soon Content</h3>
        {comingSoonList.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No Coming Soon content yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comingSoonList.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                {item.thumbnailUrl && (
                  <img src={item.thumbnailUrl} alt={item.title} className="w-full h-32 object-cover rounded mb-2" />
                )}
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.type}</p>
                {item.trailers && item.trailers.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                    ✓ {item.trailers.length} Trailer{item.trailers.length > 1 ? 's' : ''}
                  </p>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
