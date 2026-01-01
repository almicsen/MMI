import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Firebase Admin credentials.');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node scripts/seed-live.mjs <userId>');
  process.exit(1);
}

const now = new Date();
const showTimes = [
  new Date(now.getTime() + 60 * 60 * 1000),
  new Date(now.getTime() + 3 * 60 * 60 * 1000),
];

const shows = [
  {
    title: 'HQ Trivia',
    prize: 10000,
    startTime: Timestamp.fromDate(showTimes[0]),
    status: 'scheduled',
  },
  {
    title: 'HQ Pop',
    prize: 5000,
    startTime: Timestamp.fromDate(showTimes[1]),
    status: 'scheduled',
  },
];

const run = async () => {
  await db.collection('config').doc('main').set(
    {
      liveEnabled: true,
    },
    { merge: true }
  );

  const batch = db.batch();
  shows.forEach((show) => {
    const ref = db.collection('liveShows').doc();
    batch.set(ref, show);
  });

  batch.set(db.collection('liveStats').doc(userId), {
    balance: 80,
    hearts: 1,
    weeklyRank: 158,
  });

  await batch.commit();
  console.log('Seeded Live config, shows, and stats.');
};

run().catch((error) => {
  console.error('Failed to seed Live data:', error);
  process.exit(1);
});
