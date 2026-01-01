'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSeries } from '@/lib/firebase/firestore';
import { Series } from '@/lib/firebase/types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { uploadVideo } from '@/lib/cloudinary';
import { useToast } from '@/contexts/ToastContext';
import SectionHeading from './ui/SectionHeading';
import Card from './ui/Card';
import Select from './ui/Select';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Button from './ui/Button';

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
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <section className="section">
        <SectionHeading
          eyebrow="Employee workspace"
          title="Upload new episodes"
          subtitle="Submit content for review and publish approval."
        />
      </section>

      <section className="section-tight">
        <Card>
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-[color:var(--text-2)]">Series</label>
              <Select
                value={selectedSeries}
                onChange={(e) => setSelectedSeries(e.target.value)}
                required
                className="mt-2"
              >
                <option value="">Select a series</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-[color:var(--text-2)]">Title</label>
              <Input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[color:var(--text-2)]">Description</label>
              <Textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-2"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-[color:var(--text-2)]">Episode number</label>
                <Input
                  type="number"
                  value={formData.episodeNumber}
                  onChange={(e) => setFormData({ ...formData, episodeNumber: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[color:var(--text-2)]">Season number</label>
                <Input
                  type="number"
                  value={formData.seasonNumber}
                  onChange={(e) => setFormData({ ...formData, seasonNumber: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[color:var(--text-2)]">Media file</label>
              <Input
                type="file"
                required
                accept="video/*,audio/*"
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                className="mt-2"
              />
            </div>

            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Submit for approval'}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
