# Firestore Security Rules Setup Guide

## ✅ Rules Updated

The Firestore security rules have been updated to fix the "Missing or insufficient permissions" error. The rules now:

1. **Safely handle missing user documents** - No more errors when a user first logs in
2. **Allow public read access** - Public collections (projects, content, etc.) are readable by everyone
3. **Protect admin functions** - Only admins can write to protected collections
4. **Support all collections** - Rules for all collections used in the app

## 📋 How to Deploy Rules

### Option 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `mobilemediainteractions-912cd`
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab
5. Copy the contents of `firestore.rules` from this project
6. Paste into the Firebase Console rules editor
7. Click **Publish**

### Option 2: Firebase CLI

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:rules
```

## 🔒 Security Rules Overview

### Public Collections (Anyone can read)
- ✅ `projects` - All projects
- ✅ `content` - Published content only
- ✅ `series` - Published series only
- ✅ `blogPosts` - Published posts only
- ✅ `pages` - All pages (About, Services, etc.)
- ✅ `config` - Site configuration
- ✅ `comingSoon` - Coming soon content
- ✅ `playerConfigs` - Player configurations
- ✅ `contentAnalytics` - Public analytics
- ✅ `contentRatings` - Content ratings
- ✅ `recommendations` - AI recommendations

### Authenticated Collections (Users can read/write their own)
- ✅ `users/{userId}` - Users can read/update their own profile
- ✅ `userPreferences/{userId}` - Users can manage their own preferences
- ✅ `viewEvents` - Users can create view events (tracking)
- ✅ `contentRatings` - Users can submit ratings

### Admin-Only Collections
- ✅ `users` - Only admins can write/delete
- ✅ `pendingUploads` - Employees can create, admins can approve
- ✅ All write operations require admin role

## 🧪 Testing Rules

After deploying, test:

1. **Public Access**: Visit homepage without logging in - should load projects
2. **User Access**: Login with Google - should access your profile
3. **Admin Access**: Login as admin - should access admin panel

## ⚠️ Important Notes

- **User Documents**: Rules now safely handle cases where user documents don't exist yet
- **Role Checking**: Uses safe role checking that won't fail if document is missing
- **Public Content**: All published content is readable by everyone
- **Analytics**: View events can be created by authenticated users, but only admins can read them

## 🐛 If You Still Get Errors

1. **Check Firebase Console**: Make sure rules are published
2. **Check User Role**: Make sure your user document has a `role` field
3. **Check Collection Names**: Make sure collection names match exactly
4. **Clear Browser Cache**: Sometimes cached rules cause issues

## 📝 Next Steps

1. Deploy the rules to Firebase Console
2. Test the homepage (should work without login)
3. Test login (should work without errors)
4. Test admin panel (if you're an admin)

The rules are now production-ready! 🚀

