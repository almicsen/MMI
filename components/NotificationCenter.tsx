'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToUserNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from '@/lib/firebase/siteNotifications';
import { SiteNotification } from '@/lib/firebase/types';
import { useToast } from '@/contexts/ToastContext';
import InAppBrowser from './InAppBrowser';

export default function NotificationCenter() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [notifications, setNotifications] = useState<SiteNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inAppBrowserUrl, setInAppBrowserUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    try {
      const unsubscribe = subscribeToUserNotifications(user.uid, (notifs) => {
        if (!isMounted) return;
        
        try {
          setNotifications(notifs);
          setUnreadCount(notifs.filter((n) => !n.read).length);
          setLoading(false);
        } catch (error) {
          console.error('Error processing notifications:', error);
          if (isMounted) {
            setLoading(false);
          }
        }
      });

      return () => {
        isMounted = false;
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from notifications:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up notification subscription:', error);
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [user?.uid]); // Only depend on user.uid, not the whole user object

  const handleNotificationClick = async (notification: SiteNotification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
    }

    if (notification.link) {
      if (notification.openInAppBrowser) {
        // Open in in-app browser
        setInAppBrowserUrl(notification.link);
        setIsOpen(false);
      } else {
        // Full navigation
        router.push(notification.link);
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsRead(user.uid);
      toast.showSuccess('All notifications marked as read');
    } catch (error) {
      toast.showError('Error marking notifications as read');
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700';
      case 'error':
        return 'bg-red-100 border-red-300 dark:bg-red-900 dark:border-red-700';
      default:
        return 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700';
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel - Mobile Optimized */}
          <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[calc(100vh-120px)] sm:max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">🔔</div>
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l-4 ${
                        notification.read
                          ? 'border-transparent'
                          : getTypeColor(notification.type)
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* In-App Browser */}
      {inAppBrowserUrl && (
        <InAppBrowser
          url={inAppBrowserUrl}
          onClose={() => setInAppBrowserUrl(null)}
        />
      )}
    </div>
  );
}

