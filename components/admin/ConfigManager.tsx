'use client';

import { useEffect, useState } from 'react';
import { getConfig, updateConfig } from '@/lib/firebase/firestore';
import { Config } from '@/lib/firebase/types';
import { useToast } from '@/contexts/ToastContext';

export default function ConfigManager() {
  const toast = useToast();
  const [config, setConfig] = useState<Config>({ 
    blogEnabled: false,
    aboutEnabled: true,
    servicesEnabled: true,
    contactEnabled: true,
    projectsEnabled: true,
    mmiPlusEnabled: true,
    liveEnabled: false,
    messagesEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await getConfig();
        setConfig(data);
      } catch (error) {
        console.error('Error loading config:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig(config);
      toast.showSuccess('Config saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.showError('Error saving config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading config...</div>;
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Page Visibility</h2>
      
      <div className="space-y-3 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
          <span>Enable About Page</span>
          <input
            type="checkbox"
            checked={config.aboutEnabled !== false}
            onChange={(e) => setConfig({ ...config, aboutEnabled: e.target.checked })}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
          <span>Enable Services Page</span>
          <input
            type="checkbox"
            checked={config.servicesEnabled !== false}
            onChange={(e) => setConfig({ ...config, servicesEnabled: e.target.checked })}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
          <span>Enable Blog</span>
          <input
            type="checkbox"
            checked={config.blogEnabled}
            onChange={(e) => setConfig({ ...config, blogEnabled: e.target.checked })}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
          <span>Enable MMI+ Page</span>
          <input
            type="checkbox"
            checked={config.mmiPlusEnabled !== false}
            onChange={(e) => setConfig({ ...config, mmiPlusEnabled: e.target.checked })}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
          <span>Enable MMI + Live</span>
          <input
            type="checkbox"
            checked={config.liveEnabled === true}
            onChange={(e) => setConfig({ ...config, liveEnabled: e.target.checked })}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
          <span>Enable Contact Page</span>
          <input
            type="checkbox"
            checked={config.contactEnabled !== false}
            onChange={(e) => setConfig({ ...config, contactEnabled: e.target.checked })}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
          <span>Enable Projects Page</span>
          <input
            type="checkbox"
            checked={config.projectsEnabled !== false}
            onChange={(e) => setConfig({ ...config, projectsEnabled: e.target.checked })}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
          <span>Enable Messages Page</span>
          <input
            type="checkbox"
            checked={config.messagesEnabled === true}
            onChange={(e) => setConfig({ ...config, messagesEnabled: e.target.checked })}
            className="rounded"
          />
        </label>
      </div>

      <div className="space-y-3 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">System Settings</h3>
        <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
          <span>Maintenance Mode</span>
          <input
            type="checkbox"
            checked={config.maintenanceMode || false}
            onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
            className="rounded"
          />
        </label>
      </div>

      <div className="space-y-3 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Profile Photo Settings</h3>
        <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
          <div>
            <span className="block">Allow Profile Photo Upload</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Users can upload custom profile photos</span>
          </div>
          <input
            type="checkbox"
            checked={config.allowProfilePhotoUpload !== false}
            onChange={(e) => setConfig({ ...config, allowProfilePhotoUpload: e.target.checked })}
            className="rounded"
          />
        </label>
        {config.allowProfilePhotoUpload !== false && (
          <>
            <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
              <div>
                <span className="block">Allow Override Google Photo</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Allow overriding Google profile photo</span>
              </div>
              <input
                type="checkbox"
                checked={config.allowProfilePhotoOverride !== false}
                onChange={(e) => setConfig({ ...config, allowProfilePhotoOverride: e.target.checked })}
                className="rounded"
              />
            </label>
            <label className="flex items-center justify-between text-gray-700 dark:text-gray-300">
              <div>
                <span className="block">Allow Camera for Profile Photo</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Users can use device camera to take photos</span>
              </div>
              <input
                type="checkbox"
                checked={config.allowCameraForProfilePhoto !== false}
                onChange={(e) => setConfig({ ...config, allowCameraForProfilePhoto: e.target.checked })}
                className="rounded"
              />
            </label>
          </>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Config'}
      </button>
    </div>
  );
}
