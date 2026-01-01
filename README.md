# MobileMediaInteractions Website

A full-featured Next.js web application for MobileMediaInteractions, featuring authentication, content management, and role-based access control.

## Features

- **Public Pages**: Home, About, Services, Blog (toggleable), MMI+ (content hub), Contact
- **Authentication**: Google OAuth and email/password sign-in
- **Role-Based Access**: Guest, Employee, and Admin roles
- **Content Management**: Admin CMS with WYSIWYG editor
- **MMI+ Content Hub**: Series, Movies, and Podcasts with progress tracking
- **Employee Dashboard**: Content upload with approval workflow
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Mobile-first, works on all devices

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Hosting**: Vercel

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- npm or yarn
- Firebase account (free tier)

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Google provider
   - Enable Email/Password provider
4. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Copy the security rules from `firestore.rules`
5. Set up Storage:
   - Go to Storage
   - Get started
   - Copy the security rules from `storage.rules`
6. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" and add a web app
   - Copy the config values

### 3. Environment Variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in your Firebase configuration values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Server-side admin credentials (required for sessions + admin APIs):

```env
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

This starts the local API server first, waits for readiness, and then starts the Next.js app at [http://localhost:3000](http://localhost:3000).

If you only want the frontend:

```bash
npm run dev:web
```

### 6. Migrate Existing Data (Optional)

If you have existing projects in `json/projects.json`, you can migrate them to Firestore:

```bash
# First, install ts-node if not already installed
npm install -g ts-node

# Run the migration script
npx ts-node scripts/migrate-projects.ts
```

**Note**: Make sure your `.env.local` is configured before running the migration.

### 7. Create First Admin User

1. Sign up through the login page (either Google or email)
2. Go to Firebase Console > Firestore Database
3. Find your user document in the `users` collection
4. Change the `role` field from `guest` to `admin`
5. You now have admin access!

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

## Project Structure

```
/
├── app/                    # Next.js app directory
│   ├── about/             # About page
│   ├── admin/             # Admin dashboard
│   ├── blog/              # Blog pages
│   ├── contact/           # Contact page
│   ├── dashboard/         # Employee dashboard
│   ├── login/             # Login page
│   ├── mmi-plus/          # MMI+ content hub
│   ├── profile/           # User profile
│   ├── services/          # Services page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── admin/             # Admin components
│   └── ...
├── contexts/              # React contexts
├── lib/                   # Utilities
│   └── firebase/          # Firebase configuration
├── scripts/               # Utility scripts
└── public/                # Static assets
```

## Database Schema

### Collections

- **users**: User accounts with roles and progress
- **projects**: Project listings
- **content**: Series episodes, movies, podcasts
- **series**: Series metadata
- **blogPosts**: Blog posts
- **pages**: Static page content (About, Services)
- **config**: Site configuration (blog enabled, etc.)
- **contactMessages**: Authenticated contact messages (admin inbox)
- **pendingUploads**: Employee uploads awaiting approval
- **adminAuditLogs**: Audit trail for admin actions
- **sessions**: Server-side session tokens (admin-only)
- **liveShows**: MMI + Live schedule items
- **liveStats**: Per-user Live stats (balance, hearts, weekly rank)

## Security

- Firebase Security Rules enforce role-based access
- All user inputs are sanitized
- Protected routes require authentication
- Admin-only operations are server-side validated

## Sessions & Auth

- Sessions persist for 30 days of inactivity with rolling renewal.
- Short-lived session cookies are rotated automatically.
- Logout revokes the current session server-side.
- Admin routes and APIs validate server-side sessions in addition to client auth.

## Contact Inbox

- Contact is visible and usable only for authenticated users.
- Messages are stored in Firestore and visible only in the admin inbox.
- Admin updates are audit-logged in `adminAuditLogs`.
- No external email is sent.

## MMI + Live (Upcoming)

- Feature flag: `config.liveEnabled` (toggle in Admin → Config).
- Route: `/live` (authenticated).
- APIs: `GET /api/live/schedule`, `GET /api/live/stats`.
- Data:
  - `liveShows`: `{ title, prize, startTime, status }`
  - `liveStats`: `{ balance, hearts, weeklyRank }` per userId
- Seed demo data:
  - `npm run seed:live <userId>`

## Testing

```bash
npm test
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Copyright © MobileMediaInteractions. All Rights Reserved.
