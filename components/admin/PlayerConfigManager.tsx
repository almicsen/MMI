'use client';

import { useEffect, useState } from 'react';
import { getContent } from '@/lib/firebase/firestore';
import { Content, ContentPlayerConfig, XRayData, CustomButton } from '@/lib/firebase/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from '@/contexts/ToastContext';
import VideoTimelineEditor from './VideoTimelineEditor';

interface PlayerConfigManagerProps {
  onContentSelect?: (contentId: string | null) => void;
}

export default function PlayerConfigManager({ onContentSelect }: PlayerConfigManagerProps) {
  const toast = useToast();
  const [contentList, setContentList] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<string>('');
  const [config, setConfig] = useState<ContentPlayerConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMode, setEditingMode] = useState<'intro' | 'recap' | null>(null);
  const [selectedContentData, setSelectedContentData] = useState<Content | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await getContent();
        setContentList(data);
      } catch (error) {
        console.error('Error loading content:', error);
      }
    };
    loadContent();
  }, []);

  useEffect(() => {
    if (selectedContent) {
      // Notify parent to update preview
      onContentSelect?.(selectedContent);
      
      const loadConfig = async () => {
        setLoading(true);
        try {
          const [configDoc, contentData] = await Promise.all([
            getDoc(doc(db, 'playerConfigs', selectedContent)),
            getContent().then((list) => list.find((c) => c.id === selectedContent)),
          ]);

          setSelectedContentData(contentData || null);

          if (configDoc.exists()) {
            setConfig(configDoc.data() as ContentPlayerConfig);
          } else {
            setConfig({
              contentId: selectedContent,
              skipIntro: { enabled: false, startTime: 0, endTime: 0 },
              skipRecap: { enabled: false, startTime: 0, endTime: 0 },
              xRayEnabled: false,
              xRayData: [],
            });
          }
        } catch (error) {
          console.error('Error loading config:', error);
        } finally {
          setLoading(false);
        }
      };
      loadConfig();
    } else {
      onContentSelect?.(null);
    }
  }, [selectedContent]);

  const handleSave = async () => {
    if (!selectedContent || !config) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'playerConfigs', selectedContent), config);
      toast.showSuccess('Player configuration saved!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.showError('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const addXRayItem = () => {
    if (!config) return;
    setConfig({
      ...config,
      xRayData: [
        ...(config.xRayData || []),
        {
          timestamp: 0,
          type: 'actor',
          title: '',
          metadata: {},
        },
      ],
    });
  };

  const updateXRayItem = (index: number, updates: Partial<XRayData>) => {
    if (!config || !config.xRayData) return;
    const newXRayData = [...config.xRayData];
    newXRayData[index] = { ...newXRayData[index], ...updates };
    setConfig({ ...config, xRayData: newXRayData });
  };

  const removeXRayItem = (index: number) => {
    if (!config || !config.xRayData) return;
    const newXRayData = config.xRayData.filter((_, i) => i !== index);
    setConfig({ ...config, xRayData: newXRayData });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Select Content
        </label>
        <select
          value={selectedContent}
          onChange={(e) => setSelectedContent(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">Select content...</option>
          {contentList.map((content) => (
            <option key={content.id} value={content.id}>
              {content.title} ({content.type})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading configuration...</div>
      ) : config ? (
        <div className="space-y-6">
          {/* Skip Intro */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skip Intro</h3>
              <div className="flex items-center gap-4">
                {selectedContentData && selectedContentData.type !== 'podcast' && (
                  <button
                    onClick={() => setEditingMode(editingMode === 'intro' ? null : 'intro')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    {editingMode === 'intro' ? 'Close Timeline' : 'Open Timeline Editor'}
                  </button>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.skipIntro?.enabled || false}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        skipIntro: {
                          ...config.skipIntro,
                          enabled: e.target.checked,
                          startTime: config.skipIntro?.startTime || 0,
                          endTime: config.skipIntro?.endTime || 0,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
                </label>
              </div>
            </div>
            {editingMode === 'intro' && selectedContentData && (
              <div className="mb-4">
                <VideoTimelineEditor
                  content={selectedContentData}
                  initialStartTime={config.skipIntro?.startTime || 0}
                  initialEndTime={config.skipIntro?.endTime || 0}
                  onTimeSelect={(start, end) => {
                    setConfig({
                      ...config,
                      skipIntro: {
                        enabled: config.skipIntro?.enabled || false,
                        startTime: start,
                        endTime: end,
                      },
                    });
                  }}
                />
              </div>
            )}
            {config.skipIntro?.enabled && editingMode !== 'intro' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Start Time (seconds)
                  </label>
                  <input
                    type="number"
                    step="0.033"
                    value={config.skipIntro.startTime}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        skipIntro: {
                          ...config.skipIntro!,
                          startTime: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    End Time (seconds)
                  </label>
                  <input
                    type="number"
                    step="0.033"
                    value={config.skipIntro.endTime}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        skipIntro: {
                          ...config.skipIntro!,
                          endTime: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Skip Recap */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skip Recap</h3>
              <div className="flex items-center gap-4">
                {selectedContentData && selectedContentData.type !== 'podcast' && (
                  <button
                    onClick={() => setEditingMode(editingMode === 'recap' ? null : 'recap')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    {editingMode === 'recap' ? 'Close Timeline' : 'Open Timeline Editor'}
                  </button>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.skipRecap?.enabled || false}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        skipRecap: {
                          ...config.skipRecap,
                          enabled: e.target.checked,
                          startTime: config.skipRecap?.startTime || 0,
                          endTime: config.skipRecap?.endTime || 0,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
                </label>
              </div>
            </div>
            {editingMode === 'recap' && selectedContentData && (
              <div className="mb-4">
                <VideoTimelineEditor
                  content={selectedContentData}
                  initialStartTime={config.skipRecap?.startTime || 0}
                  initialEndTime={config.skipRecap?.endTime || 0}
                  onTimeSelect={(start, end) => {
                    setConfig({
                      ...config,
                      skipRecap: {
                        enabled: config.skipRecap?.enabled || false,
                        startTime: start,
                        endTime: end,
                      },
                    });
                  }}
                />
              </div>
            )}
            {config.skipRecap?.enabled && editingMode !== 'recap' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Start Time (seconds)
                  </label>
                  <input
                    type="number"
                    step="0.033"
                    value={config.skipRecap.startTime}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        skipRecap: {
                          ...config.skipRecap!,
                          startTime: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    End Time (seconds)
                  </label>
                  <input
                    type="number"
                    step="0.033"
                    value={config.skipRecap.endTime}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        skipRecap: {
                          ...config.skipRecap!,
                          endTime: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Custom Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Buttons</h3>
              <button
                onClick={() => {
                  if (!config) return;
                  const newButton: CustomButton = {
                    id: `custom-${Date.now()}`,
                    label: 'New Button',
                    startTime: 0,
                    endTime: 0,
                    action: 'skip',
                  };
                  setConfig({
                    ...config,
                    customButtons: [...(config.customButtons || []), newButton],
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Add Custom Button
              </button>
            </div>
            {config.customButtons && config.customButtons.length > 0 && (
              <div className="space-y-4">
                {config.customButtons.map((button, index) => (
                  <div key={button.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Button {index + 1}</h4>
                      <button
                        onClick={() => {
                          if (!config) return;
                          setConfig({
                            ...config,
                            customButtons: config.customButtons?.filter((b) => b.id !== button.id),
                          });
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Label
                        </label>
                        <input
                          type="text"
                          value={button.label}
                          onChange={(e) => {
                            if (!config) return;
                            const newButtons = [...(config.customButtons || [])];
                            newButtons[index] = { ...newButtons[index], label: e.target.value };
                            setConfig({ ...config, customButtons: newButtons });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          placeholder="e.g., Next Episode"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Action
                        </label>
                        <select
                          value={button.action}
                          onChange={(e) => {
                            if (!config) return;
                            const newButtons = [...(config.customButtons || [])];
                            newButtons[index] = {
                              ...newButtons[index],
                              action: e.target.value as 'skip' | 'next-episode' | 'custom',
                            };
                            setConfig({ ...config, customButtons: newButtons });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="skip">Skip</option>
                          <option value="next-episode">Next Episode</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Start Time (seconds)
                        </label>
                        <input
                          type="number"
                          step="0.033"
                          value={button.startTime}
                          onChange={(e) => {
                            if (!config) return;
                            const newButtons = [...(config.customButtons || [])];
                            newButtons[index] = { ...newButtons[index], startTime: parseFloat(e.target.value) };
                            setConfig({ ...config, customButtons: newButtons });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          End Time (seconds)
                        </label>
                        <input
                          type="number"
                          step="0.033"
                          value={button.endTime}
                          onChange={(e) => {
                            if (!config) return;
                            const newButtons = [...(config.customButtons || [])];
                            newButtons[index] = { ...newButtons[index], endTime: parseFloat(e.target.value) };
                            setConfig({ ...config, customButtons: newButtons });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    {button.action === 'skip' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Skip To Time (seconds)
                        </label>
                        <input
                          type="number"
                          step="0.033"
                          value={button.actionData?.skipToTime || 0}
                          onChange={(e) => {
                            if (!config) return;
                            const newButtons = [...(config.customButtons || [])];
                            newButtons[index] = {
                              ...newButtons[index],
                              actionData: { skipToTime: parseFloat(e.target.value) },
                            };
                            setConfig({ ...config, customButtons: newButtons });
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-play Next Episode */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Auto-play Next Episode</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.autoPlayNext?.enabled || false}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      autoPlayNext: {
                        enabled: e.target.checked,
                        countdownSeconds: config.autoPlayNext?.countdownSeconds || 10,
                      },
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
              </label>
            </div>
            {config.autoPlayNext?.enabled && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Countdown (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={config.autoPlayNext.countdownSeconds || 10}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      autoPlayNext: {
                        enabled: true,
                        countdownSeconds: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Time before automatically playing next episode (5-30 seconds)
                </p>
              </div>
            )}
          </div>

          {/* X-Ray */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">X-Ray Insights</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.xRayEnabled}
                  onChange={(e) => setConfig({ ...config, xRayEnabled: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable</span>
              </label>
            </div>
            {config.xRayEnabled && (
              <div className="space-y-4">
                <button
                  onClick={addXRayItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add X-Ray Item
                </button>
                {config.xRayData?.map((item, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Timestamp (seconds)
                        </label>
                        <input
                          type="number"
                          value={item.timestamp}
                          onChange={(e) => updateXRayItem(index, { timestamp: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Type
                        </label>
                        <select
                          value={item.type}
                          onChange={(e) => updateXRayItem(index, { type: e.target.value as any })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="actor">Actor</option>
                          <option value="song">Song</option>
                          <option value="location">Location</option>
                          <option value="fact">Fact</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Title
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateXRayItem(index, { title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    {item.type === 'actor' && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Actor Name
                          </label>
                          <input
                            type="text"
                            value={item.metadata?.actorName || ''}
                            onChange={(e) =>
                              updateXRayItem(index, {
                                metadata: { ...item.metadata, actorName: e.target.value },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Character Name
                          </label>
                          <input
                            type="text"
                            value={item.metadata?.character || ''}
                            onChange={(e) =>
                              updateXRayItem(index, {
                                metadata: { ...item.metadata, character: e.target.value },
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => updateXRayItem(index, { description: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={item.imageUrl || ''}
                        onChange={(e) => updateXRayItem(index, { imageUrl: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <button
                      onClick={() => removeXRayItem(index)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

