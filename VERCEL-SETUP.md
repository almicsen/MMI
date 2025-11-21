# Vercel Deployment Setup Guide

This guide will help you configure your environment variables in Vercel so your deployment works correctly.

## 🔴 Critical: Environment Variables Required

Your Firebase configuration must be set in Vercel for the build to succeed. Without these, you'll get `auth/invalid-api-key` errors during deployment.

## Step 1: Get Your Firebase Configuration

If you don't have your Firebase config values, get them from:

1. **Firebase Console**: https://console.firebase.google.com/
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Scroll down to **Your apps** section
5. Click on your web app (or create one if needed)
6. Copy the config values

You should see something like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 2: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (MMI)
3. **Go to Settings** → **Environment Variables**
4. **Add each variable** one by one:

### Required Firebase Variables

| Variable Name | Value | Example |
|--------------|-------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API Key | `AIzaSyC...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Your auth domain | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your project ID | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Your storage bucket | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your messaging sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your app ID | `1:123456789:web:abc123` |

### Optional Cloudinary Variables (if using Cloudinary)

| Variable Name | Value | Example |
|--------------|-------|---------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | `your-cloud-name` |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | Your Cloudinary API key | `123456789` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Your upload preset | `mmi-uploads` |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | `your-secret-key` |

### Optional Google Analytics (if using)

| Variable Name | Value | Example |
|--------------|-------|---------|
| `NEXT_PUBLIC_GA_ID` | Your Google Analytics ID | `G-XXXXXXXXXX` |

## Step 3: Set Environment for Each Variable

For each variable:
- **Environment**: Select all three:
  - ✅ **Production**
  - ✅ **Preview**
  - ✅ **Development**

This ensures the variables are available in all environments.

## Step 4: Redeploy

After adding all environment variables:

1. **Go to Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Step 5: Verify Deployment

After redeployment:

1. Check the **Build Logs** to ensure no errors
2. Visit your deployed site
3. Test Firebase features (login, etc.)
4. Check browser console for any errors

## 🔍 Troubleshooting

### Error: "auth/invalid-api-key"
- **Cause**: Firebase environment variables are missing or incorrect
- **Fix**: Double-check all `NEXT_PUBLIC_FIREBASE_*` variables are set correctly in Vercel

### Error: "Missing or insufficient permissions"
- **Cause**: Firestore security rules not deployed
- **Fix**: Deploy `firestore.rules` to Firebase Console → Firestore → Rules

### Build succeeds but site doesn't work
- **Cause**: Environment variables might not be set for the correct environment
- **Fix**: Ensure variables are set for **Production**, **Preview**, and **Development**

### Variables not updating
- **Cause**: Vercel caches environment variables
- **Fix**: Redeploy after adding/updating variables

## 📝 Quick Reference

### Copy-Paste Checklist

Add these to Vercel Environment Variables:

```
✅ NEXT_PUBLIC_FIREBASE_API_KEY
✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID
✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
✅ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
✅ NEXT_PUBLIC_FIREBASE_APP_ID
✅ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME (if using)
✅ NEXT_PUBLIC_CLOUDINARY_API_KEY (if using)
✅ NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (if using)
✅ CLOUDINARY_API_SECRET (if using)
✅ NEXT_PUBLIC_GA_ID (if using)
```

## 🎯 Next Steps

After setting up environment variables:

1. ✅ Deploy Firestore rules (see `DEPLOY-RULES-NOW.md`)
2. ✅ Test authentication on deployed site
3. ✅ Verify admin panel works
4. ✅ Check that content loads correctly

---

**Need help?** Check the Firebase Console and Vercel documentation for more details.

