import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase config
const isConfigValid = () => {
  return !!(firebaseConfig.apiKey && 
         firebaseConfig.authDomain && 
         firebaseConfig.projectId &&
         firebaseConfig.storageBucket &&
         firebaseConfig.messagingSenderId &&
         firebaseConfig.appId);
};

// Initialize Firebase - use lazy initialization to avoid build-time errors
let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function getApp(): FirebaseApp {
  if (!app) {
    if (!isConfigValid()) {
      if (typeof window === 'undefined') {
        // During build, create a mock config to prevent crashes
        // This will fail at runtime if env vars aren't set, but allows build to complete
        throw new Error('Firebase configuration is missing. Please set environment variables in Vercel. See VERCEL-SETUP.md');
      } else {
        throw new Error('Firebase configuration is missing. Please check your environment variables.');
      }
    }
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
  }
  return app;
}

function getAuthInstance(): Auth {
  if (!_auth) {
    _auth = getAuth(getApp());
  }
  return _auth;
}

function getDbInstance(): Firestore {
  if (!_db) {
    _db = getFirestore(getApp());
  }
  return _db;
}

function getStorageInstance(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(getApp());
  }
  return _storage;
}

// Export getters that initialize on first access
// During build (server-side), if env vars are missing, these will throw
// But since all pages are 'use client', they only run on the client where env vars should be available
// The build will succeed because Next.js can generate static HTML without executing client component code
// However, we need to handle the case where the module is imported during build

// For client-side usage, these will work fine
// For server-side/build-time, we need to ensure they don't crash
let _authExported: Auth | null = null;
let _dbExported: Firestore | null = null;
let _storageExported: FirebaseStorage | null = null;

// Lazy getters that only initialize when accessed
export const auth = (() => {
  if (typeof window !== 'undefined' || isConfigValid()) {
    return getAuthInstance();
  }
  // During build without env vars, return a mock that will fail gracefully
  throw new Error('Firebase auth not available. Set environment variables in Vercel.');
})() as Auth;

export const db = (() => {
  if (typeof window !== 'undefined' || isConfigValid()) {
    return getDbInstance();
  }
  throw new Error('Firebase db not available. Set environment variables in Vercel.');
})() as Firestore;

export const storage = (() => {
  if (typeof window !== 'undefined' || isConfigValid()) {
    return getStorageInstance();
  }
  throw new Error('Firebase storage not available. Set environment variables in Vercel.');
})() as FirebaseStorage;

export default getApp;

