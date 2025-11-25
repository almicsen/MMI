'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  createAPIKey, 
  getUserAPIKeys, 
  updateAPIKey, 
  revokeAPIKey, 
  deleteAPIKey,
  getAPIUsageStats 
} from '@/lib/api/keys';
import { APIKey } from '@/lib/firebase/types';

export default function APIKeyManager() {
  const { user } = useAuth();
  const toast = useToast();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
  const [usageStats, setUsageStats] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    scopes: [] as string[],
    allowedUrls: [''] as string[],
    description: '',
    expiresAt: '',
  });

  useEffect(() => {
    if (user) {
      loadKeys();
    }
  }, [user]);

  const loadKeys = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const userKeys = await getUserAPIKeys(user.uid);
      setKeys(userKeys);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.showError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!user?.uid) return;
    if (!formData.name.trim()) {
      toast.showError('Key name is required');
      return;
    }
    if (formData.scopes.length === 0) {
      toast.showError('At least one scope is required');
      return;
    }

    try {
      const allowedUrls = formData.allowedUrls.filter(url => url.trim() !== '');
      const expiresAt = formData.expiresAt ? new Date(formData.expiresAt) : undefined;
      
      const { key, keyData } = await createAPIKey(
        user.uid,
        formData.name,
        formData.scopes,
        allowedUrls,
        'free', // Default tier - will be set based on approval
        expiresAt
      );

      setNewKey(key); // Show the key (only shown once)
      setKeys([...keys, keyData]);
      setShowCreateForm(false);
      setFormData({
        name: '',
        scopes: [],
        allowedUrls: [''],
        description: '',
        expiresAt: '',
      });
      toast.showSuccess('API key created successfully! Copy it now - you won\'t see it again.');
    } catch (error: any) {
      console.error('Error creating API key:', error);
      toast.showError(error.message || 'Failed to create API key');
    }
  };

  const handleUpdateKey = async (keyId: string) => {
    if (!user?.uid) return;
    try {
      const key = keys.find(k => k.id === keyId);
      if (!key) return;

      await updateAPIKey(keyId, user.uid, {
        name: key.name,
        allowedUrls: key.allowedUrls,
        scopes: key.scopes,
        active: key.active,
        description: key.description,
        expiresAt: key.expiresAt,
      });

      toast.showSuccess('API key updated');
      loadKeys();
    } catch (error: any) {
      toast.showError(error.message || 'Failed to update API key');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!user?.uid) return;
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      await revokeAPIKey(keyId, user.uid);
      toast.showSuccess('API key revoked');
      loadKeys();
    } catch (error: any) {
      toast.showError(error.message || 'Failed to revoke API key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!user?.uid) return;
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) return;

    try {
      await deleteAPIKey(keyId, user.uid);
      toast.showSuccess('API key deleted');
      loadKeys();
    } catch (error: any) {
      toast.showError(error.message || 'Failed to delete API key');
    }
  };

  const loadUsageStats = async (keyId: string) => {
    if (!user?.uid) return;
    try {
      const stats = await getAPIUsageStats(keyId, user.uid);
      setUsageStats(stats);
      setSelectedKey(keys.find(k => k.id === keyId) || null);
    } catch (error: any) {
      toast.showError(error.message || 'Failed to load usage stats');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.showSuccess('Copied to clipboard!');
  };

  const availableScopes = [
    { value: 'read', label: 'Read', description: 'Read content and data' },
    { value: 'write', label: 'Write', description: 'Create and update content' },
    { value: 'notifications', label: 'Notifications', description: 'Send notifications' },
    { value: 'content', label: 'Content', description: 'Access content endpoints' },
  ];

  if (loading) {
    return <div className="animate-pulse text-purple-300">Loading API keys...</div>;
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">API Key Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-lg transition-all shadow-lg shadow-cyan-500/20"
        >
          {showCreateForm ? 'Cancel' : '+ Create API Key'}
        </button>
      </div>

      {/* New Key Display (shown once after creation) */}
      {newKey && (
        <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-300 mb-2">⚠️ Important: Save Your API Key</h3>
          <p className="text-green-200 mb-4">
            This is the only time you'll see this key. Copy it now and store it securely.
          </p>
          <div className="bg-slate-900 rounded-lg p-4 mb-4">
            <code className="text-green-400 font-mono text-sm break-all">{newKey}</code>
          </div>
          <button
            onClick={() => copyToClipboard(newKey)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Copy Key
          </button>
          <button
            onClick={() => setNewKey(null)}
            className="ml-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            I've Saved It
          </button>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-slate-800/50 rounded-lg border border-cyan-500/20 p-6">
          <h3 className="text-xl font-semibold mb-4">Create New API Key</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-cyan-300">Key Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My API Key"
                className="w-full px-4 py-2 bg-slate-700 border border-cyan-500/30 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-cyan-300">Scopes *</label>
              <div className="space-y-2">
                {availableScopes.map((scope) => (
                  <label key={scope.value} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.scopes.includes(scope.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, scopes: [...formData.scopes, scope.value] });
                        } else {
                          setFormData({ ...formData, scopes: formData.scopes.filter(s => s !== scope.value) });
                        }
                      }}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-white font-medium">{scope.label}</div>
                      <div className="text-sm text-cyan-200/70">{scope.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-cyan-300">Allowed URLs (Optional)</label>
              <p className="text-xs text-cyan-200/70 mb-2">
                URLs that are exempt from origin checking. Leave empty to only allow requests from this site.
              </p>
              {formData.allowedUrls.map((url, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...formData.allowedUrls];
                      newUrls[index] = e.target.value;
                      setFormData({ ...formData, allowedUrls: newUrls });
                    }}
                    placeholder="https://example.com"
                    className="flex-1 px-4 py-2 bg-slate-700 border border-cyan-500/30 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                  />
                  {formData.allowedUrls.length > 1 && (
                    <button
                      onClick={() => {
                        setFormData({ ...formData, allowedUrls: formData.allowedUrls.filter((_, i) => i !== index) });
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setFormData({ ...formData, allowedUrls: [...formData.allowedUrls, ''] })}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                + Add URL
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-cyan-300">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this key used for?"
                rows={3}
                className="w-full px-4 py-2 bg-slate-700 border border-cyan-500/30 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-cyan-300">Expires At (Optional)</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-cyan-500/30 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <button
              onClick={handleCreateKey}
              className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-lg transition-all"
            >
              Create API Key
            </button>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-slate-800/50 rounded-lg border border-cyan-500/20 overflow-hidden">
        <div className="divide-y divide-cyan-500/20">
          {keys.length === 0 ? (
            <div className="p-8 text-center text-cyan-300">
              <p>No API keys created yet.</p>
            </div>
          ) : (
            keys.map((key) => (
              <div key={key.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{key.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        key.active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {key.active ? 'Active' : 'Revoked'}
                      </span>
                      {key.expiresAt && key.expiresAt < new Date() && (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300">
                          Expired
                        </span>
                      )}
                    </div>
                    {key.description && (
                      <p className="text-sm text-cyan-200/70 mb-2">{key.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {key.scopes.map((scope) => (
                        <span key={scope} className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-300 rounded">
                          {scope}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-cyan-200/60 space-y-1">
                      <p>Created: {new Date(key.createdAt).toLocaleString()}</p>
                      {key.lastUsed && <p>Last used: {new Date(key.lastUsed).toLocaleString()}</p>}
                      {key.expiresAt && <p>Expires: {new Date(key.expiresAt).toLocaleString()}</p>}
                      {key.allowedUrls.length > 0 && (
                        <p>Allowed URLs: {key.allowedUrls.length}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadUsageStats(key.id!)}
                      className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Stats
                    </button>
                    <button
                      onClick={() => handleRevokeKey(key.id!)}
                      disabled={!key.active}
                      className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      Revoke
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.id!)}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Usage Stats Modal */}
      {selectedKey && usageStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-cyan-500/20 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Usage Statistics: {selectedKey.name}</h3>
              <button
                onClick={() => {
                  setSelectedKey(null);
                  setUsageStats(null);
                }}
                className="text-cyan-400 hover:text-cyan-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-sm text-cyan-300">Total Requests</div>
                  <div className="text-2xl font-bold text-white">{usageStats.totalRequests}</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <div className="text-sm text-cyan-300">Avg Response Time</div>
                  <div className="text-2xl font-bold text-white">{usageStats.averageResponseTime.toFixed(2)}ms</div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">Status Codes</h4>
                <div className="space-y-1">
                  {Object.entries(usageStats.statusCodes).map(([code, count]) => (
                    <div key={code} className="flex justify-between text-sm">
                      <span className="text-white">{code}</span>
                      <span className="text-cyan-300">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">Endpoints</h4>
                <div className="space-y-1">
                  {Object.entries(usageStats.endpoints).map(([endpoint, count]) => (
                    <div key={endpoint} className="flex justify-between text-sm">
                      <span className="text-white">{endpoint}</span>
                      <span className="text-cyan-300">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

