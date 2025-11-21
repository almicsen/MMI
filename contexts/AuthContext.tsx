'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, getUserData } from '@/lib/firebase/auth';
import { User } from '@/lib/firebase/types';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userData = await getUserData(firebaseUser.uid);
          setUser(userData);
        } catch (error: any) {
          console.error('Error fetching user data:', error);
          // If user document doesn't exist, getUserData will create it automatically
          // So we can retry once
          if (error.message?.includes('User document not found')) {
            try {
              // Wait a moment for document creation, then retry
              await new Promise(resolve => setTimeout(resolve, 500));
              const userData = await getUserData(firebaseUser.uid);
              setUser(userData);
            } catch (retryError) {
              console.error('Error on retry:', retryError);
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

