'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, Timestamp, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Content, AudiobookChapter } from '@/lib/firebase/types';
import { useToast } from '@/contexts/ToastContext';
import { uploadImage, uploadVideo } from '@/lib/cloudinary';

type ContentType = 'series' | 'movie' | 'podcast' | 'audiobook';

export default function MMIPlusManager() {
  const toast = useToast();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');
  const [showOriginalOnly, setShowOriginalOnly] = useState(false);
  
  // Intro management
  const [videoIntroUrl, setVideoIntroUrl] = useState('');
  const [audioIntroUrl, setAudioIntroUrl] = useState('');
  
  // Audiobook chapter management
  const [chapters, setChapters] = useState<AudiobookChapter[]>([]);
  const [editingChapter, setEditingChapter] = useState<AudiobookChapter | null>(null);
  const [bookFileUrl, setBookFileUrl] = useState('');
  
  // Trailer management
  const [trailerUrl, setTrailerUrl] = useState('');
  const [trailerType, setTrailerType] = useState<'video' | 'audio'>('video');
  
  // Paid content
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    loadContent();
    loadIntroSettings();
  }, [filterType, showOriginalOnly]);

  const loadContent = async () => {
    try {
      setLoading(true);
      let q = query(collection(db, 'content'), orderBy('createdAt', 'desc'));
      
      if (filterType !== 'all') {
        q = query(q, where('type', '==', filterType));
      }
      
      const snapshot = await getDocs(q);
      let contentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Content[];
      
      if (showOriginalOnly) {
        contentList = contentList.filter(c => c.isMMIOriginal);
      }
      
      setContent(contentList);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.showError('Error loading content');
    } finally {
      setLoading(false);
    }
  };

  const loadIntroSettings = async () => {
    try {
      // Load global intro settings from config or a separate collection
      const configDoc = await getDocs(query(collection(db, 'config'), where('id', '==', 'mmiPlusIntros')));
      if (!configDoc.empty) {
        const data = configDoc.docs[0].data();
        setVideoIntroUrl(data.videoIntroUrl || '');
        setAudioIntroUrl(data.audioIntroUrl || '');
      }
    } catch (error) {
      console.error('Error loading intro settings:', error);
    }
  };

  const saveIntroSettings = async () => {
    try {
      await addDoc(collection(db, 'config'), {
        id: 'mmiPlusIntros',
        videoIntroUrl,
        audioIntroUrl,
        updatedAt: Timestamp.now(),
      });
      toast.showSuccess('Intro settings saved!');
    } catch (error) {
      console.error('Error saving intro settings:', error);
      toast.showError('Error saving intro settings');
    }
  };

  const handleContentSelect = (item: Content) => {
    setSelectedContent(item);
    setChapters(item.chapters || []);
    setBookFileUrl(item.bookFileUrl || '');
    setTrailerUrl(item.trailerUrl || '');
    // Determine trailer type based on content type
    if (item.type === 'movie' || item.type === 'series') {
      setTrailerType('video');
    } else if (item.type === 'podcast' || item.type === 'audiobook') {
      setTrailerType('audio');
    }
    setIsPaid(item.isPaid || false);
    setPrice(item.price || 0);
  };

  const toggleMMIOriginal = async (item: Content) => {
    try {
      await updateDoc(doc(db, 'content', item.id), {
        isMMIOriginal: !item.isMMIOriginal,
        updatedAt: Timestamp.now(),
      });
      toast.showSuccess(`Content marked as ${!item.isMMIOriginal ? 'MMI+ Original' : 'Regular Content'}`);
      loadContent();
    } catch (error) {
      console.error('Error updating content:', error);
      toast.showError('Error updating content');
    }
  };

  const addChapter = () => {
    const newChapter: AudiobookChapter = {
      id: Date.now().toString(),
      title: '',
      startTime: chapters.length > 0 ? (chapters[chapters.length - 1].endTime || chapters[chapters.length - 1].startTime + 60) : 0,
      endTime: undefined,
      pageNumber: undefined,
      description: '',
    };
    setEditingChapter(newChapter);
  };

  const saveChapter = () => {
    if (!editingChapter) return;
    
    const updatedChapters = [...chapters];
    const index = updatedChapters.findIndex(c => c.id === editingChapter.id);
    
    if (index >= 0) {
      updatedChapters[index] = editingChapter;
    } else {
      updatedChapters.push(editingChapter);
    }
    
    // Sort by startTime
    updatedChapters.sort((a, b) => a.startTime - b.startTime);
    
    // Auto-set endTime if not set (use next chapter's startTime)
    for (let i = 0; i < updatedChapters.length - 1; i++) {
      if (!updatedChapters[i].endTime) {
        updatedChapters[i].endTime = updatedChapters[i + 1].startTime;
      }
    }
    
    setChapters(updatedChapters);
    setEditingChapter(null);
  };

  const deleteChapter = (chapterId: string) => {
    setChapters(chapters.filter(c => c.id !== chapterId));
  };

  const saveAudiobookSettings = async () => {
    if (!selectedContent) return;
    
    try {
      await updateDoc(doc(db, 'content', selectedContent.id), {
        chapters,
        bookFileUrl: bookFileUrl || undefined,
        updatedAt: Timestamp.now(),
      });
      toast.showSuccess('Audiobook settings saved!');
      loadContent();
    } catch (error) {
      console.error('Error saving audiobook settings:', error);
      toast.showError('Error saving audiobook settings');
    }
  };

  const saveContentSettings = async () => {
    if (!selectedContent) return;
    
    try {
      const updateData: any = {
        trailerUrl: trailerUrl || undefined,
        trailerType: trailerType,
        isPaid: isPaid || false,
        price: isPaid ? price : undefined,
        updatedAt: Timestamp.now(),
      };
      
      if (selectedContent.type === 'audiobook') {
        updateData.chapters = chapters;
        updateData.bookFileUrl = bookFileUrl || undefined;
      }
      
      await updateDoc(doc(db, 'content', selectedContent.id), updateData);
      toast.showSuccess('Content settings saved!');
      loadContent();
    } catch (error) {
      console.error('Error saving content settings:', error);
      toast.showError('Error saving content settings');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">MMI+ Content Manager</h2>
          <p className="text-cyan-300/70 text-sm mt-1">Complete control over MMI+ content and originals</p>
        </div>
      </div>

      {/* Intro Settings */}
      <div className="bg-slate-800/60 rounded-xl border border-cyan-500/20 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">MMI+ Intro Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-cyan-200">Video Intro URL (for video content)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={videoIntroUrl}
                onChange={(e) => setVideoIntroUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400"
              />
              <input
                type="file"
                accept="video/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const url = await uploadVideo(file);
                      setVideoIntroUrl(url);
                    } catch (error) {
                      toast.showError('Error uploading video');
                    }
                  }
                }}
                className="hidden"
                id="video-intro-upload"
              />
              <label
                htmlFor="video-intro-upload"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Upload
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-cyan-200">Audio Intro URL (for audio/podcast content)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={audioIntroUrl}
                onChange={(e) => setAudioIntroUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400"
              />
              <input
                type="file"
                accept="audio/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const url = await uploadVideo(file); // Cloudinary handles audio too
                      setAudioIntroUrl(url);
                    } catch (error) {
                      toast.showError('Error uploading audio');
                    }
                  }
                }}
                className="hidden"
                id="audio-intro-upload"
              />
              <label
                htmlFor="audio-intro-upload"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Upload
              </label>
            </div>
          </div>
          <button
            onClick={saveIntroSettings}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all"
          >
            Save Intro Settings
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ContentType | 'all')}
          className="px-4 py-2 bg-slate-800/60 border border-cyan-500/30 rounded-lg text-white"
        >
          <option value="all">All Types</option>
          <option value="series">Series</option>
          <option value="movie">Movies</option>
          <option value="podcast">Podcasts</option>
          <option value="audiobook">Audiobooks</option>
        </select>
        <label className="flex items-center gap-2 text-cyan-200">
          <input
            type="checkbox"
            checked={showOriginalOnly}
            onChange={(e) => setShowOriginalOnly(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          Show MMI+ Originals Only
        </label>
      </div>

      {/* Content List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {content.map((item) => (
          <div
            key={item.id}
            className={`bg-slate-800/60 rounded-xl border p-4 cursor-pointer transition-all ${
              selectedContent?.id === item.id
                ? 'border-cyan-500 shadow-lg shadow-cyan-500/20'
                : 'border-cyan-500/20 hover:border-cyan-500/50'
            }`}
            onClick={() => handleContentSelect(item)}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-white">{item.title}</h4>
              {item.isMMIOriginal && (
                <span className="px-2 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs rounded">
                  Original
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-2">{item.type}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMMIOriginal(item);
              }}
              className={`text-xs px-3 py-1 rounded ${
                item.isMMIOriginal
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-gray-300'
              }`}
            >
              {item.isMMIOriginal ? 'MMI+ Original' : 'Mark as Original'}
            </button>
          </div>
        ))}
      </div>

      {/* Selected Content Details */}
      {selectedContent && (
        <div className="bg-slate-800/60 rounded-xl border border-cyan-500/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">{selectedContent.title}</h3>
          
          {selectedContent.type === 'audiobook' && (
            <div className="space-y-6">
              {/* Book File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2 text-cyan-200">EPUB Book File</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bookFileUrl}
                    onChange={(e) => setBookFileUrl(e.target.value)}
                    placeholder="EPUB file URL"
                    className="flex-1 px-4 py-2 bg-slate-700/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400"
                  />
                  <input
                    type="file"
                    accept=".epub,application/epub+zip"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const url = await uploadVideo(file); // Cloudinary can handle EPUB
                          setBookFileUrl(url);
                        } catch (error) {
                          toast.showError('Error uploading EPUB');
                        }
                      }
                    }}
                    className="hidden"
                    id="epub-upload"
                  />
                  <label
                    htmlFor="epub-upload"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Upload EPUB
                  </label>
                </div>
              </div>

              {/* Chapters */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Chapters</h4>
                  <button
                    onClick={addChapter}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm"
                  >
                    + Add Chapter
                  </button>
                </div>
                
                <div className="space-y-2">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className="bg-slate-700/50 rounded-lg p-4 border border-cyan-500/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-white">{chapter.title || `Chapter ${index + 1}`}</h5>
                          <p className="text-sm text-gray-400">
                            {formatTime(chapter.startTime)} - {chapter.endTime ? formatTime(chapter.endTime) : 'End'}
                            {chapter.pageNumber && ` • Page ${chapter.pageNumber}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingChapter(chapter)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteChapter(chapter.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapter Editor */}
              {editingChapter && (
                <div className="bg-slate-700/50 rounded-lg p-4 border border-cyan-500/30">
                  <h5 className="font-semibold text-white mb-4">Edit Chapter</h5>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-cyan-200">Title</label>
                      <input
                        type="text"
                        value={editingChapter.title}
                        onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-800 border border-cyan-500/30 rounded-lg text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-cyan-200">Start Time (seconds)</label>
                        <input
                          type="number"
                          value={editingChapter.startTime}
                          onChange={(e) => setEditingChapter({ ...editingChapter, startTime: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 bg-slate-800 border border-cyan-500/30 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-cyan-200">End Time (seconds, optional)</label>
                        <input
                          type="number"
                          value={editingChapter.endTime || ''}
                          onChange={(e) => setEditingChapter({ ...editingChapter, endTime: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-full px-4 py-2 bg-slate-800 border border-cyan-500/30 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-cyan-200">Page Number (for EPUB sync)</label>
                      <input
                        type="number"
                        value={editingChapter.pageNumber || ''}
                        onChange={(e) => setEditingChapter({ ...editingChapter, pageNumber: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-4 py-2 bg-slate-800 border border-cyan-500/30 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-cyan-200">Description (optional)</label>
                      <textarea
                        value={editingChapter.description || ''}
                        onChange={(e) => setEditingChapter({ ...editingChapter, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-800 border border-cyan-500/30 rounded-lg text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveChapter}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                      >
                        Save Chapter
                      </button>
                      <button
                        onClick={() => setEditingChapter(null)}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={saveAudiobookSettings}
                className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all mb-4"
              >
                Save Audiobook Settings
              </button>
            </div>
          )}

          {/* Save All Settings Button */}
          <button
            onClick={saveContentSettings}
            className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all font-semibold"
          >
            Save All Settings
          </button>
        </div>
      )}
    </div>
  );
}

