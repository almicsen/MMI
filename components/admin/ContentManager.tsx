'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Content, Series } from '@/lib/firebase/types';
import { uploadImage, uploadVideo } from '@/lib/cloudinary';
import { getAllSeries, createSeries, addEpisodeToSeries } from '@/lib/firebase/firestore';
import { useToast } from '@/contexts/ToastContext';

type ContentMode = 'create' | 'episode';

export default function ContentManager() {
  const toast = useToast();
  const [mode, setMode] = useState<ContentMode>('create');
  const [contentType, setContentType] = useState<'series' | 'movie' | 'podcast'>('movie');
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [creatingNewSeries, setCreatingNewSeries] = useState(false);
  
  // Series creation form
  const [seriesForm, setSeriesForm] = useState({
    name: '',
    description: '',
    published: false,
  });
  const [seriesLogoFile, setSeriesLogoFile] = useState<File | null>(null);
  const [seriesThumbnailFile, setSeriesThumbnailFile] = useState<File | null>(null);
  const [seriesBackgroundFile, setSeriesBackgroundFile] = useState<File | null>(null);
  const [seriesLogoUrl, setSeriesLogoUrl] = useState('');
  const [seriesThumbnailUrl, setSeriesThumbnailUrl] = useState('');
  const [seriesBackgroundUrl, setSeriesBackgroundUrl] = useState('');

  // Content/Episode form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaUrl: '',
    thumbnailUrl: '',
    seasonNumber: '',
    episodeNumber: '',
    published: false,
    releaseType: 'instant' as 'instant' | 'scheduled',
    scheduledReleaseDate: '',
    scheduledReleaseTime: '',
  });
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [fetchingSpotify, setFetchingSpotify] = useState(false);
  const [importedSpotifyShowId, setImportedSpotifyShowId] = useState<string | null>(null);
  const [rssUrl, setRssUrl] = useState('');
  const [importingRSS, setImportingRSS] = useState(false);

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const data = await getAllSeries();
        setSeriesList(data);
      } catch (error) {
        console.error('Error loading series:', error);
      }
    };
    if (contentType === 'series' || contentType === 'podcast') {
      loadSeries();
    }
  }, [contentType]);

  const importSpotifyShow = async () => {
    if (!spotifyUrl.trim()) {
      toast.showWarning('Please enter a Spotify show URL');
      return;
    }

    setFetchingSpotify(true);
    try {
      const response = await fetch(`/api/spotify-metadata?url=${encodeURIComponent(spotifyUrl)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch metadata');
      }

      if (data.type !== 'show') {
        toast.showWarning('Please enter a Spotify show/podcast URL, not an episode URL');
        setFetchingSpotify(false);
        return;
      }

      // Auto-create the series
      let logoUrl = data.thumbnail || '';
      let thumbnailUrl = data.thumbnail || '';

      const seriesId = await createSeries({
        name: data.title || 'Untitled Podcast',
        description: data.description || '',
        thumbnailUrl: thumbnailUrl || undefined,
        logoUrl: logoUrl || undefined,
        published: true, // Auto-publish imported series
      });

      // Store the Spotify show ID for future episode imports
      setImportedSpotifyShowId(data.spotifyId);
      
      // Reload series list and select the new series
      const updatedSeries = await getAllSeries();
      setSeriesList(updatedSeries);
      setSelectedSeriesId(seriesId);
      setCreatingNewSeries(false);

      // Clear series form since it's already created
      setSeriesForm({ name: '', description: '', published: false });
      setSeriesLogoUrl('');
      setSeriesThumbnailUrl('');
      setSeriesBackgroundUrl('');

      toast.showSuccess(`Podcast series "${data.title}" imported successfully! You can now add episodes.`);
    } catch (error: any) {
      console.error('Error importing Spotify show:', error);
      toast.showError(`Error: ${error.message || 'Failed to import Spotify show'}`);
    } finally {
      setFetchingSpotify(false);
    }
  };

  const fetchSpotifyMetadata = async () => {
    if (!spotifyUrl.trim()) {
      toast.showWarning('Please enter a Spotify URL');
      return;
    }

    setFetchingSpotify(true);
    try {
      const response = await fetch(`/api/spotify-metadata?url=${encodeURIComponent(spotifyUrl)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch metadata');
      }

      // If it's a show URL, auto-import if creating new series, otherwise ask
      if (data.type === 'show') {
        if (creatingNewSeries) {
          // Auto-import since user is already in "Create New Series" mode
          await importSpotifyShow();
          return;
        } else {
          // Ask user if they want to import as new series
          const shouldImport = await toast.confirm(
            `This is a Spotify show/podcast. Would you like to import it as a new series?\n\nTitle: ${data.title}\n\nThis will create the series automatically with all metadata.`,
            {
              title: 'Import as New Series?',
              confirmText: 'Import',
              cancelText: 'Cancel',
              type: 'info',
            }
          );
          
          if (shouldImport) {
            await importSpotifyShow();
            return;
          }
        }
      }

      // Auto-populate form fields for episodes
      if (data.title) {
        setFormData(prev => ({ ...prev, title: data.title }));
      }
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }));
      }
      if (data.thumbnail) {
        setFormData(prev => ({ ...prev, thumbnailUrl: data.thumbnail }));
        setThumbnailFile(null); // Clear file input if URL is set
      }
      if (data.spotifyUrl) {
        setFormData(prev => ({ ...prev, mediaUrl: data.spotifyUrl }));
      }

      toast.showSuccess('Spotify metadata fetched successfully!');
    } catch (error: any) {
      console.error('Error fetching Spotify metadata:', error);
      toast.showError(`Error: ${error.message || 'Failed to fetch Spotify metadata'}`);
    } finally {
      setFetchingSpotify(false);
    }
  };

  const importRSSFeed = async () => {
    if (!rssUrl.trim()) {
      toast.showWarning('Please enter an RSS feed URL');
      return;
    }

    setImportingRSS(true);
    try {
      const response = await fetch('/api/rss-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rssUrl }),
      });

      const feedData = await response.json();

      if (!response.ok) {
        throw new Error(feedData.error || 'Failed to import RSS feed');
      }

      // Confirm import
      const episodeCount = feedData.episodes?.length || 0;
      const confirmMessage = `Import podcast series from RSS?\n\n` +
        `Title: ${feedData.title}\n` +
        `Episodes: ${episodeCount}\n\n` +
        `This will create the series and all ${episodeCount} episodes automatically.`;

      if (!confirm(confirmMessage)) {
        setImportingRSS(false);
        return;
      }

      // Create the series first
      const seriesId = await createSeries({
        name: feedData.title,
        description: feedData.description,
        thumbnailUrl: feedData.image || undefined,
        logoUrl: feedData.image || undefined,
        published: true,
      });

      // Reload series list and select the new series
      const updatedSeries = await getAllSeries();
      setSeriesList(updatedSeries);
      setSelectedSeriesId(seriesId);
      setCreatingNewSeries(false);

      // Clear series form
      setSeriesForm({ name: '', description: '', published: false });
      setSeriesLogoUrl('');
      setSeriesThumbnailUrl('');
      setSeriesBackgroundUrl('');

      // Create all episodes
      let createdCount = 0;
      let skippedCount = 0;

      for (const episode of feedData.episodes) {
        try {
          // Parse episode number (default to 1 if not found)
          const episodeNum = episode.episodeNumber ? parseInt(episode.episodeNumber) : createdCount + 1;
          const seasonNum = episode.seasonNumber ? parseInt(episode.seasonNumber) : 1;

          // Get media URL from enclosure or link
          const mediaUrl = episode.enclosure?.url || episode.link || '';

          if (!mediaUrl) {
            console.warn(`Skipping episode "${episode.title}" - no media URL found`);
            skippedCount++;
            continue;
          }

          // Parse publish date
          let scheduledReleaseDate: Date | undefined = undefined;
          if (episode.pubDate) {
            const pubDate = new Date(episode.pubDate);
            if (!isNaN(pubDate.getTime()) && pubDate > new Date()) {
              scheduledReleaseDate = pubDate;
            }
          }

          // Build content object, omitting undefined values
          const content: any = {
            type: 'podcast',
            title: episode.title,
            description: episode.description,
            mediaUrl: mediaUrl,
            seriesId: seriesId,
            seasonNumber: seasonNum,
            episodeNumber: episodeNum,
            published: !scheduledReleaseDate, // Publish immediately if no scheduled date
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          // Only add optional fields if they have values
          if (episode.image || feedData.image) {
            content.thumbnailUrl = episode.image || feedData.image;
          }
          if (scheduledReleaseDate) {
            content.scheduledReleaseDate = scheduledReleaseDate;
          }

          const contentId = await addDoc(collection(db, 'content'), content).then(ref => ref.id);
          await addEpisodeToSeries(seriesId, contentId);
          createdCount++;
        } catch (error) {
          console.error(`Error creating episode "${episode.title}":`, error);
          skippedCount++;
        }
      }

      toast.showSuccess(
        `RSS feed imported successfully!\n\nSeries: ${feedData.title}\n` +
        `Episodes created: ${createdCount}\n` +
        `Episodes skipped: ${skippedCount}`
      );

      // Clear RSS URL
      setRssUrl('');
    } catch (error: any) {
      console.error('Error importing RSS feed:', error);
      toast.showError(`Error: ${error.message || 'Failed to import RSS feed'}`);
    } finally {
      setImportingRSS(false);
    }
  };

  const handleMediaUpload = async (file: File): Promise<string> => {
    if (file.type.startsWith('video/')) {
      return await uploadVideo(file, 'mmi/content/videos');
    } else if (file.type.startsWith('audio/')) {
      return await uploadVideo(file, 'mmi/content/audio');
    } else {
      throw new Error('Unsupported file type. Please upload a video or audio file.');
    }
  };

  const handleCreateSeries = async () => {
    if (!seriesForm.name || !seriesForm.description) {
      toast.showWarning('Please fill in series name and description');
      return;
    }

    setUploading(true);
    try {
      let logoUrl = seriesLogoUrl;
      let thumbnailUrl = seriesThumbnailUrl;
      let backgroundUrl = seriesBackgroundUrl;

      if (seriesLogoFile) {
        logoUrl = await uploadImage(seriesLogoFile, 'mmi/series/logos');
      }
      if (seriesThumbnailFile) {
        thumbnailUrl = await uploadImage(seriesThumbnailFile, 'mmi/series/thumbnails');
      }
      if (seriesBackgroundFile) {
        backgroundUrl = await uploadImage(seriesBackgroundFile, 'mmi/series/backgrounds');
      }

      const seriesId = await createSeries({
        name: seriesForm.name,
        description: seriesForm.description,
        thumbnailUrl: thumbnailUrl || undefined,
        logoUrl: logoUrl || undefined,
        backgroundUrl: backgroundUrl || undefined, // This is fine - createSeries will handle it
        published: seriesForm.published,
      });

      toast.showSuccess('Series created successfully!');
      
      // Reload series list and select the new series
      const data = await getAllSeries();
      setSeriesList(data);
      setSelectedSeriesId(seriesId);
      setCreatingNewSeries(false);
      setSeriesForm({ name: '', description: '', published: false });
      setSeriesLogoFile(null);
      setSeriesThumbnailFile(null);
      setSeriesBackgroundFile(null);
      setSeriesLogoUrl('');
      setSeriesThumbnailUrl('');
      setSeriesBackgroundUrl('');
    } catch (error) {
      console.error('Error creating series:', error);
      toast.showError('Error creating series');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (contentType === 'series' || contentType === 'podcast') {
      if (!selectedSeriesId && !creatingNewSeries) {
        toast.showWarning('Please select a series or create a new one');
        return;
      }
      if (!formData.seasonNumber || !formData.episodeNumber) {
        toast.showWarning('Please enter season and episode numbers');
        return;
      }
    }

    setUploading(true);

    try {
      // If creating new series first
      let finalSeriesId = selectedSeriesId;
      if (creatingNewSeries) {
        let logoUrl = seriesLogoUrl;
        let thumbnailUrl = seriesThumbnailUrl;
        let backgroundUrl = seriesBackgroundUrl;

        if (seriesLogoFile) {
          logoUrl = await uploadImage(seriesLogoFile, 'mmi/series/logos');
        }
        if (seriesThumbnailFile) {
          thumbnailUrl = await uploadImage(seriesThumbnailFile, 'mmi/series/thumbnails');
        }
        if (seriesBackgroundFile) {
          backgroundUrl = await uploadImage(seriesBackgroundFile, 'mmi/series/backgrounds');
        }

        finalSeriesId = await createSeries({
          name: seriesForm.name,
          description: seriesForm.description,
          thumbnailUrl: thumbnailUrl || undefined,
          logoUrl: logoUrl || undefined,
          backgroundUrl: backgroundUrl || undefined,
          published: seriesForm.published,
        });
      }

      let mediaUrl = formData.mediaUrl;
      let thumbnailUrl = formData.thumbnailUrl;

      if (mediaFile) {
        mediaUrl = await handleMediaUpload(mediaFile);
      }

      if (thumbnailFile) {
        thumbnailUrl = await uploadImage(thumbnailFile, 'mmi/content/thumbnails');
      }

      // Handle scheduled release
      let scheduledReleaseDate: Date | undefined = undefined;
      if (formData.releaseType === 'scheduled' && formData.scheduledReleaseDate && formData.scheduledReleaseTime) {
        const dateTimeString = `${formData.scheduledReleaseDate}T${formData.scheduledReleaseTime}`;
        scheduledReleaseDate = new Date(dateTimeString);
        
        // Validate that scheduled date is in the future
        if (scheduledReleaseDate <= new Date()) {
          toast.showWarning('Scheduled release date must be in the future');
          setUploading(false);
          return;
        }
      }

      // Build content object, omitting undefined values
      const content: any = {
        type: contentType,
        title: formData.title,
        description: formData.description,
        mediaUrl,
        published: formData.releaseType === 'instant' ? formData.published : false, // If scheduled, don't publish yet
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Only add optional fields if they have values
      if (thumbnailUrl) content.thumbnailUrl = thumbnailUrl;
      if ((contentType === 'series' || contentType === 'podcast') && finalSeriesId) {
        content.seriesId = finalSeriesId;
      }
      if ((contentType === 'series' || contentType === 'podcast') && formData.seasonNumber) {
        content.seasonNumber = parseInt(formData.seasonNumber);
      }
      if ((contentType === 'series' || contentType === 'podcast') && formData.episodeNumber) {
        content.episodeNumber = parseInt(formData.episodeNumber);
      }
      if (scheduledReleaseDate) {
        content.scheduledReleaseDate = scheduledReleaseDate;
      }

      const contentId = await addDoc(collection(db, 'content'), content).then(ref => ref.id);

      // Add episode to series if it's a series/podcast
      if ((contentType === 'series' || contentType === 'podcast') && finalSeriesId) {
        await addEpisodeToSeries(finalSeriesId, contentId);
      }

      if (content.published) {
        const { MMINotifications } = await import('@/lib/notifications');
        // Notification placeholder
      }

      const message = formData.releaseType === 'instant' 
        ? 'Content created and published successfully!'
        : `Content created successfully! It will be published on ${formData.scheduledReleaseDate} at ${formData.scheduledReleaseTime}`;
      toast.showSuccess(message);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        mediaUrl: '',
        thumbnailUrl: '',
        seasonNumber: '',
        episodeNumber: '',
        published: false,
        releaseType: 'instant',
        scheduledReleaseDate: '',
        scheduledReleaseTime: '',
      });
      setMediaFile(null);
      setThumbnailFile(null);
      if (creatingNewSeries) {
        setSeriesForm({ name: '', description: '', published: false });
        setSeriesLogoFile(null);
        setSeriesThumbnailFile(null);
        setSeriesBackgroundFile(null);
        setSeriesLogoUrl('');
        setSeriesThumbnailUrl('');
        setSeriesBackgroundUrl('');
        setCreatingNewSeries(false);
      }
    } catch (error) {
      console.error('Error creating content:', error);
      toast.showError('Error creating content');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Content Type
        </label>
        <select
          value={contentType}
          onChange={(e) => {
            setContentType(e.target.value as any);
            setSelectedSeriesId('');
            setCreatingNewSeries(false);
          }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="movie">Movie</option>
          <option value="series">Series</option>
          <option value="podcast">Podcast</option>
        </select>
      </div>

      {(contentType === 'series' || contentType === 'podcast') && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                checked={!creatingNewSeries}
                onChange={() => setCreatingNewSeries(false)}
                className="rounded"
              />
              Add to Existing Series
            </label>
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                checked={creatingNewSeries}
                onChange={() => setCreatingNewSeries(true)}
                className="rounded"
              />
              Create New Series
            </label>
          </div>

          {!creatingNewSeries ? (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Select Series
              </label>
              <select
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              >
                <option value="">-- Select Series --</option>
                {seriesList.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Series</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Series Title *
                </label>
                <input
                  type="text"
                  required
                  value={seriesForm.name}
                  onChange={(e) => setSeriesForm({ ...seriesForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Series Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={seriesForm.description}
                  onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Series Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSeriesLogoFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <input
                  type="url"
                  placeholder="Or enter logo URL"
                  value={seriesLogoUrl}
                  onChange={(e) => setSeriesLogoUrl(e.target.value)}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Series Thumbnail
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSeriesThumbnailFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <input
                  type="url"
                  placeholder="Or enter thumbnail URL"
                  value={seriesThumbnailUrl}
                  onChange={(e) => setSeriesThumbnailUrl(e.target.value)}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Background Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSeriesBackgroundFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <input
                  type="url"
                  placeholder="Or enter background URL"
                  value={seriesBackgroundUrl}
                  onChange={(e) => setSeriesBackgroundUrl(e.target.value)}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  If no background is provided, the site will handle it gracefully
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={seriesForm.published}
                    onChange={(e) => setSeriesForm({ ...seriesForm, published: e.target.checked })}
                    className="rounded"
                  />
                  Publish Series
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        {contentType === 'podcast' && (
          <div className="space-y-4">
            {/* RSS Feed Import */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                RSS Feed (Recommended - Auto-creates series + all episodes)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/podcast.rss or https://feeds.example.com/podcast"
                  value={rssUrl}
                  onChange={(e) => setRssUrl(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={importRSSFeed}
                  disabled={importingRSS || !rssUrl.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importingRSS ? 'Importing...' : 'Import RSS Feed'}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <strong>✨ Best option:</strong> Paste your podcast RSS feed URL to automatically create the series and import all episodes with metadata!
              </p>
            </div>

            {/* Spotify Integration */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Spotify Link (Alternative - Auto-fills metadata)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://open.spotify.com/show/... or https://open.spotify.com/episode/..."
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={fetchSpotifyMetadata}
                    disabled={fetchingSpotify || !spotifyUrl.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {fetchingSpotify ? 'Fetching...' : 'Fetch Metadata'}
                  </button>
                </div>
              </div>
              {!selectedSeriesId && creatingNewSeries && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800 mt-2">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-1">
                    <strong>💡 Tip:</strong> Paste a Spotify show URL and click "Fetch Metadata" to auto-create the series!
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <strong>Show URL:</strong> Auto-creates series with all metadata (title, description, logo, thumbnail)<br />
                <strong>Episode URL:</strong> Auto-fills episode title, description, and thumbnail
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {contentType === 'movie' ? 'Title' : 'Episode Title'} *
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

        {(contentType === 'series' || contentType === 'podcast') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Season Number *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.seasonNumber}
                onChange={(e) => setFormData({ ...formData, seasonNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Episode Number *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.episodeNumber}
                onChange={(e) => setFormData({ ...formData, episodeNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Media File (or URL) *
          </label>
          <input
            type="file"
            accept="video/*,audio/*"
            onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <input
            type="url"
            placeholder={contentType === 'podcast' ? 'Or enter media URL (Spotify link will auto-fill if used above)' : 'Or enter media URL'}
            value={formData.mediaUrl}
            onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
            className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Thumbnail (optional)
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Release Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="releaseType"
                  value="instant"
                  checked={formData.releaseType === 'instant'}
                  onChange={(e) => setFormData({ ...formData, releaseType: 'instant' })}
                  className="rounded"
                />
                Instant (Available immediately)
              </label>
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="releaseType"
                  value="scheduled"
                  checked={formData.releaseType === 'scheduled'}
                  onChange={(e) => setFormData({ ...formData, releaseType: 'scheduled' })}
                  className="rounded"
                />
                Scheduled Release
              </label>
            </div>
          </div>

          {formData.releaseType === 'instant' && (
            <div>
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="rounded"
                />
                Publish immediately
              </label>
            </div>
          )}

          {formData.releaseType === 'scheduled' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Release Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.scheduledReleaseDate}
                  onChange={(e) => setFormData({ ...formData, scheduledReleaseDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Release Time *
                </label>
                <input
                  type="time"
                  required
                  value={formData.scheduledReleaseTime}
                  onChange={(e) => setFormData({ ...formData, scheduledReleaseTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Creating...' : contentType === 'movie' ? 'Create Movie' : 'Create Episode'}
        </button>
      </form>
    </div>
  );
}
