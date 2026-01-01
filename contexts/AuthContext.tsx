'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User as FirebaseUser, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { onAuthStateChange, getUserData } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/config';
import { User } from '@/lib/firebase/types';
import { updateUserActivity, markUserOffline, detectDeviceType } from '@/lib/firebase/userActivity';
import { usePathname } from 'next/navigation';
import { createSession, refreshSession, clearSession } from '@/lib/auth/sessionClient';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  sessionStatus: 'idle' | 'loading' | 'ready' | 'error';
  sessionError: string | null;
  retrySession: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  sessionStatus: 'idle',
  sessionError: null,
  retrySession: () => undefined,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const pathname = usePathname();
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRefreshRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionUserRef = useRef<string | null>(null);
  const sessionInFlightRef = useRef(false);
  const lastSessionAttemptRef = useRef(0);
  const sessionRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity
  useEffect(() => {
    if (!user?.uid) return;

    const userId = user.uid; // Capture uid to avoid dependency on user object
    const currentPathname = pathname; // Capture pathname

    const updateActivity = async () => {
      try {
        await updateUserActivity(userId, {
          isOnline: true,
          currentPage: currentPathname,
          deviceType: detectDeviceType(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        });
      } catch (error) {
        // Silently fail - don't crash the app if activity tracking fails
        console.error('Error updating user activity:', error);
      }
    };

    // Update immediately (with error handling)
    updateActivity().catch(console.error);

    // Update every 30 seconds
    activityIntervalRef.current = setInterval(() => {
      updateActivity().catch(console.error);
    }, 30000);

    // Cleanup on unmount
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
        activityIntervalRef.current = null;
      }
      // Mark as offline when component unmounts
      markUserOffline(userId).catch(() => {
        // Silently fail - don't crash on cleanup
      });
    };
  }, [user?.uid, pathname]); // Only depend on uid and pathname, not the whole user object

  useEffect(() => {
    let isMounted = true;

    setPersistence(auth, browserLocalPersistence).catch((error: unknown) => {
      console.warn('Failed to set auth persistence:', error);
    });
    
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (!isMounted) return;
      
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userData = await getUserData(firebaseUser.uid);
          if (isMounted) {
            setUser(userData);
            setLoading(false);
          }
        } catch (error: any) {
          console.error('Error fetching user data:', error);
          // If user document doesn't exist, getUserData will create it automatically
          // So we can retry once
          if (error.message?.includes('User document not found')) {
            try {
              // Wait a moment for document creation, then retry
              await new Promise(resolve => setTimeout(resolve, 500));
              const userData = await getUserData(firebaseUser.uid);
              if (isMounted) {
                setUser(userData);
                setLoading(false);
              }
            } catch (retryError) {
              console.error('Error on retry:', retryError);
              if (isMounted) {
                setUser(null);
                setLoading(false);
              }
            }
          } else {
            if (isMounted) {
              setUser(null);
              setLoading(false);
            }
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const createSessionForUser = async (force = false) => {
    if (!firebaseUser) return;
    if (sessionInFlightRef.current) return;
    const uid = firebaseUser.uid;
    const now = Date.now();
    if (!force && lastSessionUserRef.current === uid && sessionStatus === 'ready') {
      return;
    }
    if (!force && now - lastSessionAttemptRef.current < 30000) {
      return;
    }

    sessionInFlightRef.current = true;
    lastSessionAttemptRef.current = now;
    setSessionStatus('loading');
    setSessionError(null);

    try {
      const token = await firebaseUser.getIdToken();
      const result = await createSession(token);
      if (!result) {
        setSessionError('Session request throttled. Retrying shortly.');
        setSessionStatus('loading');
        if (sessionRetryTimeoutRef.current) {
          clearTimeout(sessionRetryTimeoutRef.current);
        }
        sessionRetryTimeoutRef.current = setTimeout(() => {
          createSessionForUser(true).catch(() => undefined);
        }, 30000);
        return;
      }
      lastSessionUserRef.current = uid;
      setSessionStatus('ready');
    } catch (error) {
      console.error('Failed to create session:', error);
      setSessionError('Unable to establish a secure session. Please retry.');
      setSessionStatus('error');
    } finally {
      sessionInFlightRef.current = false;
    }
  };

  useEffect(() => {
    const firebaseUid = firebaseUser?.uid || null;
    if (firebaseUser) {
      createSessionForUser();

      if (!sessionRefreshRef.current) {
        sessionRefreshRef.current = setInterval(() => {
          refreshSession()
            .then((result) => {
              if (!result) {
                createSessionForUser(true);
              } else {
                setSessionStatus('ready');
              }
            })
            .catch((error) => console.error('Failed to refresh session:', error));
        }, 20 * 60 * 1000);
      }

      lastSessionUserRef.current = firebaseUid;
    } else if (lastSessionUserRef.current) {
      clearSession().catch((error) => console.error('Failed to clear session:', error));
      lastSessionUserRef.current = null;
      if (sessionRetryTimeoutRef.current) {
        clearTimeout(sessionRetryTimeoutRef.current);
        sessionRetryTimeoutRef.current = null;
      }
      if (sessionRefreshRef.current) {
        clearInterval(sessionRefreshRef.current);
        sessionRefreshRef.current = null;
      }
      setSessionStatus('idle');
      setSessionError(null);
    }
  }, [firebaseUser]);

  // Memoize the context value to prevent unnecessary re-renders
  const retrySession = () => createSessionForUser(true);

  const contextValue = React.useMemo(
    () => ({ user, firebaseUser, loading, sessionStatus, sessionError, retrySession }),
    [user?.uid, firebaseUser?.uid, loading, sessionStatus, sessionError]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
