'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/firebase/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading, sessionStatus, sessionError, retrySession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo);
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push('/');
      }
    }
  }, [user, loading, allowedRoles, redirectTo, router]);

  if (loading || (user && sessionStatus === 'loading')) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (user && sessionStatus === 'error') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700">
          <p className="font-semibold">Session error</p>
          <p>{sessionError || 'Unable to establish a secure session.'}</p>
          <button
            type="button"
            onClick={retrySession}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Retry session
          </button>
        </div>
      </div>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
