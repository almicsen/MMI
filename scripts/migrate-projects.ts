/**
 * Migration script to move projects from JSON to Firestore
 * Run with: npx ts-node scripts/migrate-projects.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface ProjectData {
  title: string;
  description: string;
  status: string;
  startDate?: string;
  endDate?: string;
  link?: string;
  externalClients?: boolean;
  isFeatured?: boolean;
}

async function migrateProjects() {
  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, '../json/projects.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log('Migrating projects...');
    
    // Migrate projects
    for (const project of jsonData.projects || []) {
      const projectData: ProjectData = {
        title: project.title,
        description: project.description,
        status: project.status || 'pending',
        startDate: project.startDate || undefined,
        endDate: project.endDate || undefined,
        link: project.link || undefined,
        externalClients: project.externalClients || false,
        isFeatured: project.isFeatured || false,
      };

      await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`Migrated project: ${project.title}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateProjects();

