/**
 * Messaging Button Component
 * Shows in header for admins and employees
 * Navigates to /messages page
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function MessagingButton() {
  const { user } = useAuth();
  const router = useRouter();
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'employee')) return;

    // Subscribe to conversations to get unread count
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => doc.data());
      const total = conversations.reduce((sum: number, conv: any) => {
        return sum + (conv.unreadCount?.[user.uid] || 0);
      }, 0);
      setUnreadTotal(total);
    });

    return () => unsubscribe();
  }, [user]);

  // Only show for admins and employees
  if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
    return null;
  }

  return (
    <button
      onClick={() => router.push('/messages')}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Messages"
    >
      <span className="text-xl">💬</span>
      {unreadTotal > 0 && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
          {unreadTotal > 99 ? '99+' : unreadTotal}
        </span>
      )}
    </button>
  );
}

