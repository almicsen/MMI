import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  sendEmailVerification,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole } from './types';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  
  // Check if user document exists, create or update if not
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    const newUser = {
      email: user.email || '',
      role: 'guest' as UserRole,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(doc(db, 'users', user.uid), newUser);
  } else {
    // Update email if it's missing or changed
    const existingData = userDoc.data();
    if (!existingData.email || existingData.email !== user.email) {
      await updateDoc(doc(db, 'users', user.uid), {
        email: user.email || '',
        displayName: user.displayName || existingData.displayName,
        photoURL: user.photoURL || existingData.photoURL,
        updatedAt: Timestamp.now(),
      });
    }
  }
  
  return getUserData(user.uid);
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return getUserData(result.user.uid);
};

export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;
  
  // Create user document
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email || '',
    role: 'guest' as UserRole,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  
  // Send verification email
  if (user.email) {
    await sendEmailVerification(user);
  }
  
  return getUserData(user.uid);
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const changeEmail = async (newEmail: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  
  await updateEmail(user, newEmail);
  await sendEmailVerification(user);
  
  // Update in Firestore
  await updateDoc(doc(db, 'users', user.uid), {
    email: newEmail,
    updatedAt: Timestamp.now(),
  });
};

export const getUserData = async (uid: string): Promise<User> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) {
    // Create user document if it doesn't exist (shouldn't happen, but handle gracefully)
    console.warn('User document not found, creating default user document');
    const defaultUser = {
      email: '',
      role: 'guest' as UserRole,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await setDoc(doc(db, 'users', uid), defaultUser);
    return { 
      uid, 
      email: defaultUser.email,
      role: defaultUser.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  const data = userDoc.data();
  return { 
    uid: userDoc.id, 
    email: data.email || '',
    role: data.role || 'guest',
    displayName: data.displayName,
    photoURL: data.photoURL,
    progress: data.progress,
    permissions: data.permissions,
    likes: data.likes,
    favorites: data.favorites,
    watchlist: data.watchlist,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
  } as User;
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    role,
    updatedAt: Timestamp.now(),
  });
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

