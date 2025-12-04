# Firebase Setup Checklist

Use this checklist to ensure all Firebase setup steps are completed.

## ✅ Configuration Files

- [x] `.env.local` file created with Firebase config values
- [x] All environment variables properly named (starting with `NEXT_PUBLIC_`)
- [x] Google Analytics ID added (optional)

## ✅ Firebase Console Setup

### Authentication
- [ ] Go to Firebase Console > Authentication > Sign-in method
- [ ] Enable **Google** provider
  - [ ] Toggle "Enable" to ON
  - [ ] Add project support email
  - [ ] Click "Save"
- [ ] (Optional) Enable **Email/Password** for future use

### Firestore Database
- [ ] Go to Firebase Console > Firestore Database
- [ ] Click "Create database" (if not already created)
- [ ] Select "Start in production mode"
- [ ] Choose a location
- [ ] Click "Enable"
- [ ] Go to "Rules" tab
- [ ] Copy rules from `firestore.rules` file in this project
- [ ] Paste and click "Publish"

### Storage
- [ ] **IMPORTANT**: Enable Blaze plan first (see `FIREBASE-STORAGE-SETUP.md`)
- [ ] Go to Firebase Console > Project Settings > Usage and billing
- [ ] Upgrade to Blaze plan (add payment method - free tier is generous)
- [ ] Go to Firebase Console > Storage
- [ ] Click "Get started" (if not already set up)
- [ ] Select "Start in production mode"
- [ ] Choose same location as Firestore
- [ ] Click "Done"
- [ ] Go to "Rules" tab
- [ ] Copy rules from `storage.rules` file in this project
- [ ] Paste and click "Publish"

## ✅ Code Verification

- [x] `lib/firebase/config.ts` properly configured
- [x] Environment variables loaded correctly
- [x] Google Analytics component ready (if GA ID provided)

## ✅ Testing

After completing the above steps:

1. **Restart your development server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Test Google Sign-In:**
   - Go to `/login`
   - Click "Continue with Google"
   - Should successfully authenticate

3. **Verify Firebase Connection:**
   - Check browser console for errors
   - Should see no Firebase API key errors

## Current Configuration

Your Firebase project: **mobilemediainteractions-912cd**

Environment variables configured:
- ✅ API Key
- ✅ Auth Domain
- ✅ Project ID
- ✅ Storage Bucket
- ✅ Messaging Sender ID
- ✅ App ID
- ✅ Google Analytics ID

## Next Steps

1. Complete the Firebase Console setup (Authentication, Firestore, Storage)
2. Restart your dev server
3. Test the login functionality
4. If everything works, you're all set! 🎉

