# Firebase Setup Guide - Getting Your API Key

This guide will help you get your Firebase API key and all configuration values needed for the MMI website.

## Step-by-Step Instructions

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "MMI" or "MobileMediaInteractions")
4. Click **"Continue"**
5. (Optional) Disable Google Analytics if you don't need it
6. Click **"Create project"**
7. Wait for the project to be created, then click **"Continue"**

### Step 2: Get Your Firebase Configuration

1. In the Firebase Console, click the **gear icon (⚙️)** next to "Project Overview" in the left sidebar
2. Select **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. If you don't see a web app yet:
   - Click the **web icon (`</>`)** to add a web app
   - Register your app with a nickname (e.g., "MMI Web")
   - (Optional) Check "Also set up Firebase Hosting" - you can skip this
   - Click **"Register app"**
5. You'll see a `firebaseConfig` object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

### Step 3: Copy Your Configuration Values

Copy each value from the `firebaseConfig` object. You'll need:
- `apiKey` - This is your API key (starts with "AIza")
- `authDomain` - Usually `your-project-id.firebaseapp.com`
- `projectId` - Your project ID
- `storageBucket` - Usually `your-project-id.appspot.com`
- `messagingSenderId` - A numeric ID
- `appId` - A long string starting with "1:"

### Step 4: Create Your .env.local File

1. In your project root directory (`/Users/almicsen/Documents/GitHub/MMI`), create a file named `.env.local`
2. Add the following content, replacing the values with your actual Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**Important Notes:**
- Do NOT include quotes around the values
- Do NOT include spaces around the `=` sign
- Make sure there are no trailing spaces
- The file should be named exactly `.env.local` (starts with a dot)

### Step 5: Enable Authentication

1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click **"Get started"** if you haven't set it up yet
3. Go to the **"Sign-in method"** tab
4. Enable **Google**:
   - Click on "Google"
   - Toggle the "Enable" switch to ON
   - Add your project support email
   - Click **"Save"**
5. (Optional) Enable **Email/Password** for future use:
   - Click on "Email/Password"
   - Toggle the "Enable" switch to ON
   - Click **"Save"**

### Step 6: Create Firestore Database

1. In Firebase Console, go to **Firestore Database** (left sidebar)
2. Click **"Create database"**
3. Select **"Start in production mode"** (we'll add security rules later)
4. Choose a location closest to your users
5. Click **"Enable"**
6. Wait for the database to be created

### Step 7: Set Up Storage

1. In Firebase Console, go to **Storage** (left sidebar)
2. Click **"Get started"**
3. Select **"Start in production mode"**
4. Choose the same location as Firestore
5. Click **"Done"**

### Step 8: Restart Your Development Server

After creating `.env.local` with your Firebase config:

1. Stop your development server (if running) with `Ctrl+C`
2. Restart it:
   ```bash
   npm run dev
   ```

The environment variables are loaded when the server starts, so you need to restart after creating/updating `.env.local`.

## Troubleshooting

### Error: "auth/api-key-not-valid"

**Possible causes:**
1. **Missing .env.local file** - Make sure the file exists in the project root
2. **Wrong variable names** - Must start with `NEXT_PUBLIC_`
3. **Typos in values** - Double-check you copied the values correctly
4. **Server not restarted** - Restart `npm run dev` after creating `.env.local`
5. **Quotes in values** - Don't include quotes around the values

### How to Verify Your Config

1. Check that `.env.local` exists:
   ```bash
   ls -la .env.local
   ```

2. Verify the file contents (don't share this publicly):
   ```bash
   cat .env.local
   ```

3. Make sure all variables start with `NEXT_PUBLIC_`

### Still Having Issues?

1. **Double-check the API key** - Go back to Firebase Console > Project Settings > Your apps
2. **Verify the project ID** - Make sure it matches in all variables
3. **Check for typos** - Especially in `authDomain` and `storageBucket`
4. **Restart the dev server** - Environment variables only load on startup

## Quick Reference: Where to Find Each Value

| Variable | Where to Find It |
|----------|------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Project Settings > Your apps > `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Project Settings > Your apps > `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project Settings > Your apps > `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Project Settings > Your apps > `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Project Settings > Your apps > `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Project Settings > Your apps > `appId` |

## Example .env.local File

Here's what a complete `.env.local` file should look like (with example values):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAbCdEf1234567890GhIjKlMnOpQrStUvWxYz
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mmi-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mmi-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mmi-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
```

**Remember:** Replace these example values with your actual Firebase configuration values!

