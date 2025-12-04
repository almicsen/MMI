import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Project, Collaboration, Content, Series, BlogPost, Config, User, PendingUpload, ComingSoonContent, ContentPlayerConfig } from './types';

// Projects
export const getProjects = async (): Promise<Project[]> => {
  const snapshot = await getDocs(collection(db, 'projects'));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Project));
};

export const getProject = async (id: string): Promise<Project | null> => {
  const docRef = doc(db, 'projects', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Project;
};

export const createProject = async (project: Omit<Project, 'id'>): Promise<string> => {
  const docRef = doc(collection(db, 'projects'));
  // Remove undefined values before sending to Firestore
  const cleanProject = Object.fromEntries(
    Object.entries(project).filter(([_, value]) => value !== undefined)
  );
  await setDoc(docRef, {
    ...cleanProject,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
  // Remove undefined values before sending to Firestore
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );
  await updateDoc(doc(db, 'projects', id), {
    ...cleanUpdates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteProject = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'projects', id));
};

// Collaborations
export const getCollaborations = async (): Promise<Collaboration[]> => {
  const snapshot = await getDocs(collection(db, 'collaborations'));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Collaboration));
};

export const createCollaboration = async (collaboration: Omit<Collaboration, 'id'>): Promise<string> => {
  const docRef = doc(collection(db, 'collaborations'));
  // Remove undefined values before sending to Firestore
  const cleanCollaboration = Object.fromEntries(
    Object.entries(collaboration).filter(([_, value]) => value !== undefined)
  );
  await setDoc(docRef, {
    ...cleanCollaboration,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateCollaboration = async (id: string, updates: Partial<Collaboration>): Promise<void> => {
  // Remove undefined values before sending to Firestore
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );
  await updateDoc(doc(db, 'collaborations', id), {
    ...cleanUpdates,
    updatedAt: Timestamp.now(),
  });
};

export const deleteCollaboration = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'collaborations', id));
};

// Content (Series, Movies, Podcasts)
export const getContent = async (type?: 'series' | 'movie' | 'podcast'): Promise<Content[]> => {
  let q = query(collection(db, 'content'), where('published', '==', true));
  if (type) {
    q = query(q, where('type', '==', type));
  }
  q = query(q, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Content));
};

export const getContentById = async (id: string): Promise<Content | null> => {
  const docRef = doc(db, 'content', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Content;
};

export const createContent = async (content: Omit<Content, 'id'>): Promise<string> => {
  const docRef = doc(collection(db, 'content'));
  await setDoc(docRef, {
    ...content,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

// Series
export const getSeries = async (): Promise<Series[]> => {
  const q = query(
    collection(db, 'series'),
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Series));
};

export const getAllSeries = async (): Promise<Series[]> => {
  const q = query(collection(db, 'series'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Series));
};

export const getSeriesById = async (id: string): Promise<Series | null> => {
  const docRef = doc(db, 'series', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Series;
};

export const createSeries = async (series: Omit<Series, 'id' | 'episodes'>): Promise<string> => {
  const docRef = doc(collection(db, 'series'));
  
  // Remove undefined values (Firestore doesn't allow undefined)
  const cleanSeries: any = {
    name: series.name,
    description: series.description,
    published: series.published,
    episodes: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  // Only add optional fields if they have values
  if (series.thumbnailUrl) cleanSeries.thumbnailUrl = series.thumbnailUrl;
  if (series.logoUrl) cleanSeries.logoUrl = series.logoUrl;
  if (series.backgroundUrl) cleanSeries.backgroundUrl = series.backgroundUrl;
  
  await setDoc(docRef, cleanSeries);
  return docRef.id;
};

export const updateSeries = async (id: string, updates: Partial<Series>): Promise<void> => {
  await updateDoc(doc(db, 'series', id), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const addEpisodeToSeries = async (seriesId: string, contentId: string): Promise<void> => {
  const seriesRef = doc(db, 'series', seriesId);
  const seriesDoc = await getDoc(seriesRef);
  if (!seriesDoc.exists()) throw new Error('Series not found');
  
  const episodes = seriesDoc.data().episodes || [];
  if (!episodes.includes(contentId)) {
    await updateDoc(seriesRef, {
      episodes: [...episodes, contentId],
      updatedAt: Timestamp.now(),
    });
  }
};

// Blog Posts
export const getBlogPosts = async (): Promise<BlogPost[]> => {
  const q = query(
    collection(db, 'blogPosts'),
    where('published', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BlogPost));
};

export const getBlogPost = async (id: string): Promise<BlogPost | null> => {
  const docRef = doc(db, 'blogPosts', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as BlogPost;
};

export const createBlogPost = async (post: Omit<BlogPost, 'id'>): Promise<string> => {
  const docRef = doc(collection(db, 'blogPosts'));
  await setDoc(docRef, {
    ...post,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
};

// Config
export const getConfig = async (): Promise<Config> => {
  const docRef = doc(db, 'config', 'main');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    // Return default config (all pages enabled except blog and messages)
    return { 
      blogEnabled: false,
      aboutEnabled: true,
      servicesEnabled: true,
      contactEnabled: true,
      projectsEnabled: true,
      mmiPlusEnabled: true,
      messagesEnabled: false, // Messages page disabled by default
      allowProfilePhotoUpload: true,
      allowProfilePhotoOverride: true,
      allowCameraForProfilePhoto: true,
    };
  }
  const data = docSnap.data() as Config;
  // Ensure all fields have defaults if missing
  return {
    blogEnabled: data.blogEnabled || false,
    aboutEnabled: data.aboutEnabled !== false,
    servicesEnabled: data.servicesEnabled !== false,
    contactEnabled: data.contactEnabled !== false,
    projectsEnabled: data.projectsEnabled !== false,
    mmiPlusEnabled: data.mmiPlusEnabled !== false,
    messagesEnabled: data.messagesEnabled === true, // Default to false if not explicitly true
    maintenanceMode: data.maintenanceMode || false,
    allowProfilePhotoUpload: data.allowProfilePhotoUpload ?? true,
    allowProfilePhotoOverride: data.allowProfilePhotoOverride ?? true,
    allowCameraForProfilePhoto: data.allowCameraForProfilePhoto ?? true,
  };
};

export const updateConfig = async (updates: Partial<Config>): Promise<void> => {
  await setDoc(doc(db, 'config', 'main'), updates, { merge: true });
};

// Users
export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email || '',
      role: data.role || 'guest',
      displayName: data.displayName,
      photoURL: data.photoURL,
      customPhotoURL: data.customPhotoURL,
      progress: data.progress,
      permissions: data.permissions,
      likes: data.likes,
      favorites: data.favorites,
      watchlist: data.watchlist,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
    } as User;
  });
};

// Pending Uploads
export const getPendingUploads = async (): Promise<PendingUpload[]> => {
  const q = query(
    collection(db, 'pendingUploads'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PendingUpload));
};

// Coming Soon Content
export const getComingSoon = async (): Promise<ComingSoonContent[]> => {
  const q = query(collection(db, 'comingSoon'), orderBy('releaseDate', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ComingSoonContent));
};

// Player Config
export const getPlayerConfig = async (contentId: string): Promise<ContentPlayerConfig | null> => {
  const docRef = doc(db, 'playerConfigs', contentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { contentId: docSnap.id, ...docSnap.data() } as ContentPlayerConfig;
};

