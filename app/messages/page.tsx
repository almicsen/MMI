/**
 * Team Messages Page - Slack-like messaging interface
 */
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SlackInterface from '@/components/messaging/SlackInterface';
import ProtectedRoute from '@/components/ProtectedRoute';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import LoadingState from '@/components/LoadingState';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const { enabled, loading: pageCheckLoading } = usePageEnabled('messages');

  // Show loading state while checking page enabled status or auth
  if (pageCheckLoading || authLoading) {
    return <LoadingState />;
  }

  // If page is disabled, the hook will redirect, so we don't need to render anything
  if (!enabled) {
    return <LoadingState />;
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'employee']}>
      <SlackInterface />
    </ProtectedRoute>
  );
}

