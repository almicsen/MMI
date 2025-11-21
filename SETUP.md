# Setup Guide for MobileMediaInteractions Website

This guide will walk you through setting up the MMI website from scratch.

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- A Firebase account (free tier is sufficient)
- A Google account (for Google OAuth)

## Step 1: Clone and Install

```bash
# If you haven't already, clone the repository
cd /path/to/MMI

# Install dependencies
npm install
```

## Step 2: Firebase Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "MMI" (or your preferred name)
4. Disable Google Analytics (optional, for simplicity)
5. Click "Create project"

### 2.2 Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Click on **Sign-in method** tab
3. Enable **Google** provider:
   - Click on Google
   - Toggle "Enable"
   - Add your project support email
   - Click "Save"
4. Enable **Email/Password** provider:
   - Click on Email/Password
   - Toggle "Enable"
   - Click "Save"

### 2.3 Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Start in **production mode** (we'll add rules later)
3. Choose a location (choose closest to your users)
4. Click "Enable"

### 2.4 Set Firestore Security Rules

1. Go to **Firestore Database** > **Rules** tab
2. Copy the contents of `firestore.rules` from this project
3. Paste into the rules editor
4. Click "Publish"

### 2.5 Set up Storage

1. Go to **Storage** > **Get started**
2. Start in **production mode**
3. Choose same location as Firestore
4. Click "Done"
5. Go to **Rules** tab
6. Copy contents of `storage.rules` from this project
7. Paste and click "Publish"

### 2.6 Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register app with nickname "MMI Web"
5. Copy the `firebaseConfig` object values

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

   Replace the placeholder values with the actual values from Firebase Console.

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Create Your First Admin User

1. Go to the login page: http://localhost:3000/login
2. Sign up with either:
   - Google (recommended)
   - Email and password
3. After signing up, go to [Firebase Console](https://console.firebase.google.com/)
4. Navigate to **Firestore Database**
5. Find the `users` collection
6. Click on your user document (the one with your email)
7. Edit the document and change the `role` field from `guest` to `admin`
8. Save the document
9. Refresh the website - you should now see "Admin" in the header
10. Click "Admin" to access the admin dashboard

## Step 6: Migrate Existing Projects (Optional)

If you have existing projects in `json/projects.json`, migrate them:

```bash
# Install ts-node if needed
npm install -g ts-node

# Run migration
npx ts-node scripts/migrate-projects.ts
```

**Note**: Make sure your `.env.local` is configured before running this.

## Step 7: Initial Content Setup

### 7.1 Add Projects via Admin Dashboard

1. Log in as admin
2. Go to Admin Dashboard
3. Currently, projects need to be added via Firestore directly or you can extend the admin dashboard
4. Alternatively, use the migration script above

### 7.2 Configure Blog

1. Go to Admin Dashboard > Config tab
2. Toggle "Enable Blog" if you want the blog visible
3. Click "Save Config"

### 7.3 Edit Pages

1. Go to Admin Dashboard > Pages tab
2. Select a page (About, Services)
3. Use the WYSIWYG editor to add content
4. Click "Save Page"

## Step 8: Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Sign in with GitHub
4. Click "New Project"
5. Import your repository
6. Add environment variables (same as `.env.local`)
7. Click "Deploy"

## Troubleshooting

### Authentication Not Working

- Verify Firebase Authentication is enabled
- Check that your domain is authorized in Firebase Console
- Ensure environment variables are correct

### Firestore Permission Denied

- Check that security rules are published
- Verify user role is set correctly in Firestore
- Check browser console for specific error messages

### Storage Upload Fails

- Verify Storage is enabled
- Check file size (100MB limit)
- Ensure security rules allow uploads

### Build Errors

- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Check Node.js version: `node --version` (should be 18+)

## Next Steps

- Set up Google Analytics (optional): Add `NEXT_PUBLIC_GA_ID` to `.env.local`
- Customize styling in `app/globals.css`
- Add more content via Admin Dashboard
- Configure notifications (see README.md for details)

## Support

For issues or questions, refer to the main README.md or check the codebase documentation.

