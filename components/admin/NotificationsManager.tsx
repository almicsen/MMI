'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUsers } from '@/lib/firebase/firestore';
import { User } from '@/lib/firebase/types';
import { MMINotifications } from '@/lib/notifications';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { sendSiteNotification } from '@/lib/firebase/siteNotifications';

interface Notification {
  id: string;
  type: 'email' | 'push' | 'both';
  to: string;
  template: string;
  subject?: string;
  body?: string;
  status: 'pending' | 'sent' | 'failed';
  priority?: 'low' | 'normal' | 'high';
  data?: Record<string, any>;
  createdAt?: Date;
  sentAt?: Date;
  error?: string;
}

interface TemplateConfig {
  name: string;
  label: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'select';
    options?: string[];
    placeholder?: string;
  }>;
}

const templateConfigs: Record<string, TemplateConfig> = {
  welcome: {
    name: 'welcome',
    label: 'Welcome',
    fields: [],
  },
  'new-content': {
    name: 'new-content',
    label: 'New Content',
    fields: [
      { key: 'title', label: 'Content Title', type: 'text', placeholder: 'Episode 5: The Reveal' },
    ],
  },
  'project-update': {
    name: 'project-update',
    label: 'Project Update',
    fields: [
      { key: 'projectName', label: 'Project Name', type: 'text', placeholder: 'Twisted Ties' },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in-progress', 'development', 'completed', 'archived', 'relaunching', 'announced'] },
    ],
  },
  'upload-approved': {
    name: 'upload-approved',
    label: 'Upload Approved',
    fields: [
      { key: 'title', label: 'Content Title', type: 'text', placeholder: 'Episode 3' },
    ],
  },
  'upload-rejected': {
    name: 'upload-rejected',
    label: 'Upload Rejected',
    fields: [
      { key: 'title', label: 'Content Title', type: 'text', placeholder: 'Episode 3' },
      { key: 'reason', label: 'Reason', type: 'text', placeholder: 'Needs better audio quality' },
    ],
  },
  'role-changed': {
    name: 'role-changed',
    label: 'Role Changed',
    fields: [
      { key: 'role', label: 'New Role', type: 'select', options: ['guest', 'employee', 'admin'] },
    ],
  },
};

export default function NotificationsManager() {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
  
  // Send notification form
  const [sendForm, setSendForm] = useState({
    type: 'site' as 'email' | 'push' | 'both' | 'site',
    selectedUsers: [] as string[],
    template: 'welcome',
    templateData: {} as Record<string, any>,
    // For site notifications
    title: '',
    message: '',
    notificationType: 'info' as 'info' | 'success' | 'warning' | 'error',
    link: '',
    openInAppBrowser: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notificationsData, usersData] = await Promise.all([
        getNotifications(),
        getUsers(),
      ]);
      setNotifications(notificationsData);
      
      // Ensure current user is in the list (even if not in Firestore users collection)
      const allUsers = [...usersData];
      if (currentUser && !allUsers.find((u) => u.uid === currentUser.uid)) {
        allUsers.push({
          uid: currentUser.uid,
          email: currentUser.email || '',
          role: currentUser.role || 'guest',
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        });
      }
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.showError('Error loading notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotifications = async (): Promise<Notification[]> => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000; // 1 minute in milliseconds
    
    // Process notifications and mark old pending ones as failed
    const notifications = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt;
        const notification: Notification = {
          id: doc.id,
          ...data,
          createdAt: createdAt instanceof Date ? createdAt : (createdAt ? new Date(createdAt) : new Date()),
          sentAt: data.sentAt?.toDate ? data.sentAt.toDate() : data.sentAt,
        } as Notification;

        // If notification is pending and older than 1 minute, mark as failed
        if (notification.status === 'pending' && notification.createdAt) {
          const createdAtTime = notification.createdAt.getTime();
          if (createdAtTime < oneMinuteAgo) {
            try {
              await updateDoc(doc.ref, {
                status: 'failed',
                error: 'Notification pending for more than 1 minute',
              });
              notification.status = 'failed';
              notification.error = 'Notification pending for more than 1 minute';
            } catch (error) {
              console.error('Error updating notification status:', error);
            }
          }
        }

        return notification;
      })
    );

    return notifications;
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sendForm.selectedUsers.length === 0) {
      toast.showWarning('Please select at least one recipient');
      return;
    }

    setSending(true);
    try {
      if (sendForm.type === 'site') {
        // Send site notification (in-app)
        if (!sendForm.title || !sendForm.message) {
          toast.showWarning('Please provide both title and message for site notifications');
          setSending(false);
          return;
        }

        await sendSiteNotification(sendForm.selectedUsers, {
          title: sendForm.title,
          message: sendForm.message,
          type: sendForm.notificationType,
          link: sendForm.link || undefined,
          openInAppBrowser: sendForm.openInAppBrowser,
          sentBy: currentUser?.uid,
        });

        toast.showSuccess(`Site notification sent to ${sendForm.selectedUsers.length} user(s)!`);
        setSendForm({
          type: 'site',
          selectedUsers: [],
          template: 'welcome',
          templateData: {},
          title: '',
          message: '',
          notificationType: 'info',
          link: '',
          openInAppBrowser: false,
        });
      } else {
        // Send email/push notification (existing system)
        const recipients = sendForm.selectedUsers.map((uid) => {
          const user = users.find((u) => u.uid === uid);
          return user?.email || uid;
        });

        await MMINotifications.send({
          type: sendForm.type as 'email' | 'push' | 'both',
          to: recipients,
          template: sendForm.template,
          data: sendForm.templateData,
        });

        toast.showSuccess(`Notification sent to ${recipients.length} recipient(s)!`);
        setSendForm({
          type: 'site',
          selectedUsers: [],
          template: 'welcome',
          templateData: {},
          title: '',
          message: '',
          notificationType: 'info',
          link: '',
          openInAppBrowser: false,
        });
      }
      loadData();
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.showError(`Error sending notification: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateChange = (template: string) => {
    setSendForm({
      ...sendForm,
      template,
      templateData: {}, // Reset template data when template changes
    });
  };

  const handleTemplateDataChange = (key: string, value: string) => {
    setSendForm({
      ...sendForm,
      templateData: {
        ...sendForm.templateData,
        [key]: value,
      },
    });
  };

  const toggleUserSelection = (uid: string) => {
    setSendForm({
      ...sendForm,
      selectedUsers: sendForm.selectedUsers.includes(uid)
        ? sendForm.selectedUsers.filter((id) => id !== uid)
        : [...sendForm.selectedUsers, uid],
    });
  };

  const selectAllUsers = () => {
    setSendForm({
      ...sendForm,
      selectedUsers: users.map((u) => u.uid),
    });
  };

  const clearSelection = () => {
    setSendForm({
      ...sendForm,
      selectedUsers: [],
    });
  };

  const handleRetry = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: 'pending',
        error: null,
      });
      toast.showSuccess('Notification queued for retry');
      loadData();
    } catch (error) {
      console.error('Error retrying notification:', error);
      toast.showError('Error retrying notification');
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'push':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'both':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Note:</strong> Notifications are created with "pending" status. Firebase Cloud Functions will process them automatically. 
          Notifications pending for more than 1 minute will be marked as "failed". See <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">FIREBASE-CLOUD-FUNCTIONS-SETUP.md</code> to set up.
        </p>
      </div>

      {/* Send Notification Form */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Send Notification</h2>
        
        <form onSubmit={handleSendNotification} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6 max-w-4xl">
          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Notification Type *
            </label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="site"
                  checked={sendForm.type === 'site'}
                  onChange={(e) => setSendForm({ ...sendForm, type: e.target.value as any })}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Site Notification (In-App)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="email"
                  checked={sendForm.type === 'email'}
                  onChange={(e) => setSendForm({ ...sendForm, type: e.target.value as any })}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="push"
                  checked={sendForm.type === 'push'}
                  onChange={(e) => setSendForm({ ...sendForm, type: e.target.value as any })}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Push</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="both"
                  checked={sendForm.type === 'both'}
                  onChange={(e) => setSendForm({ ...sendForm, type: e.target.value as any })}
                  className="rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Both</span>
              </label>
            </div>
          </div>

          {/* Site Notification Fields */}
          {sendForm.type === 'site' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={sendForm.title}
                  onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                  placeholder="Notification title"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Message *
                </label>
                <textarea
                  required
                  value={sendForm.message}
                  onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                  placeholder="Notification message"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Type
                </label>
                <select
                  value={sendForm.notificationType}
                  onChange={(e) => setSendForm({ ...sendForm, notificationType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Link (Optional)
                </label>
                <input
                  type="text"
                  value={sendForm.link}
                  onChange={(e) => setSendForm({ ...sendForm, link: e.target.value })}
                  placeholder="/mmi-plus or https://example.com (optional)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                {sendForm.link && (
                  <div className="mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendForm.openInAppBrowser}
                        onChange={(e) => setSendForm({ ...sendForm, openInAppBrowser: e.target.checked })}
                        className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Open in in-app browser (mobile-friendly)
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                      If unchecked, opens in full navigation. If checked, opens in a native-looking in-app browser.
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Optional: Link to navigate when notification is clicked
                </p>
              </div>
            </>
          )}

          {/* Template Selection - Only show for email/push notifications */}
          {sendForm.type !== 'site' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Template *
                </label>
                <select
                  required
                  value={sendForm.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {Object.values(templateConfigs).map((config) => (
                    <option key={config.name} value={config.name}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template-Specific Fields */}
              {templateConfigs[sendForm.template]?.fields.length > 0 && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Template Data
                  </h3>
                  {templateConfigs[sendForm.template].fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        {field.label} *
                      </label>
                      {field.type === 'select' ? (
                        <select
                          required
                          value={sendForm.templateData[field.key] || ''}
                          onChange={(e) => handleTemplateDataChange(field.key, e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          value={sendForm.templateData[field.key] || ''}
                          onChange={(e) => handleTemplateDataChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Recipient Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Recipients * ({sendForm.selectedUsers.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllUsers}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto bg-white dark:bg-gray-800">
              {users.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No users found.</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => {
                    const isCurrentUser = currentUser && user.uid === currentUser.uid;
                    return (
                      <label
                        key={user.uid}
                        className={`flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                          isCurrentUser ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={sendForm.selectedUsers.includes(user.uid)}
                          onChange={() => toggleUserSelection(user.uid)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.displayName || user.email || user.uid}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                                (Not recommended)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email && user.email !== (user.displayName || user.uid) && user.email}
                            {user.email && user.email !== (user.displayName || user.uid) && user.role && ' • '}
                            {user.role && `${user.role}`}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={sending || sendForm.selectedUsers.length === 0}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? `Sending to ${sendForm.selectedUsers.length} recipient(s)...` : `Send to ${sendForm.selectedUsers.length} recipient(s)`}
          </button>
        </form>
      </div>

      {/* Notifications List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notification History</h2>
          
          <div className="flex gap-2">
            {(['all', 'pending', 'sent', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No notifications found.</p>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(notification.status)}`}>
                        {notification.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {notification.type}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {notification.template}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-900 dark:text-white">
                        <span className="font-medium">To:</span> {notification.to}
                      </p>
                      {notification.subject && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Subject:</span> {notification.subject}
                        </p>
                      )}
                      {notification.body && (
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                          <span className="font-medium">Body:</span> {notification.body}
                        </p>
                      )}
                      {notification.createdAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Created: {notification.createdAt.toLocaleString()}
                        </p>
                      )}
                      {notification.sentAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Sent: {notification.sentAt.toLocaleString()}
                        </p>
                      )}
                      {notification.error && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Error: {notification.error}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {notification.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(notification.id)}
                      className="ml-4 bg-yellow-600 text-white py-1 px-3 rounded hover:bg-yellow-700 transition-colors text-sm"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

