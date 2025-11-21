'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, getUserData } from '@/lib/firebase/auth';
import { User } from '@/lib/firebase/types';
import { updateUserActivity, markUserOffline, detectDeviceType } from '@/lib/firebase/userActivity';
import { usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({ user, firebaseUser, loading }),
    [user?.uid, firebaseUser?.uid, loading] // Only recreate if these change
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

