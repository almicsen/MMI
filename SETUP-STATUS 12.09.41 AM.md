# Setup Status Checklist

Use this to track what's been completed and what's remaining.

## ✅ Completed

- [x] Firebase project created: `mobilemediainteractions-912cd`
- [x] Firebase configuration added to `.env.local`
- [x] Cloudinary account created
- [x] Cloudinary credentials added to `.env.local`
- [x] Cloudinary code integration complete
- [x] Firebase Storage enabled (though we're using Cloudinary)

## ⚠️ Cloudinary Upload Preset - ACTION NEEDED

You have a preset called **"MMI"** but it's set to **"Signed"** mode.

**You need to either:**
1. **Change "MMI" preset to "Unsigned"** (recommended), OR
2. **Create a new preset called "mmi-uploads"** in "Unsigned" mode

### Option 1: Change Existing Preset (Easier)
1. Click on the **"MMI"** preset in Cloudinary Dashboard
2. Change **"Signing mode"** from **"Signed"** to **"Unsigned"**
3. Click **"Save"**
4. Update `.env.local` to use `MMI` instead of `mmi-uploads`:
   ```
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=MMI
   ```

### Option 2: Create New Preset (If you want to keep MMI as Signed)
1. Click **"Add Upload Preset"**
2. Name: `mmi-uploads`
3. Signing mode: **"Unsigned"** ⚠️
4. Folder: `mmi`
5. Access mode: **"Public"**
6. Click **"Save"**
7. Keep `.env.local` as is (already set to `mmi-uploads`)

**Why "Unsigned"?**
- Allows direct uploads from browser (admin panel)
- Doesn't require API secret on client side
- Required for our implementation

## 🔧 Remaining Firebase Setup

### 1. Enable Authentication ⚠️ REQUIRED
- [ ] Go to Firebase Console > **Authentication**
- [ ] Click **"Get started"** (if not already)
- [ ] Go to **"Sign-in method"** tab
- [ ] Enable **Google** provider:
  - Click on "Google"
  - Toggle "Enable" to ON
  - Add your project support email
  - Click "Save"

### 2. Create Firestore Database ⚠️ REQUIRED
- [ ] Go to Firebase Console > **Firestore Database**
- [ ] Click **"Create database"** (if not already created)
- [ ] Select **"Start in production mode"**
- [ ] Choose a location (closest to your users)
- [ ] Click **"Enable"**
- [ ] Go to **"Rules"** tab
- [ ] Copy rules from `firestore.rules` file in this project
- [ ] Paste into rules editor
- [ ] Click **"Publish"**

### 3. Set Storage Rules (Optional - Since Using Cloudinary)
- [ ] Go to Firebase Console > **Storage**
- [ ] Go to **"Rules"** tab
- [ ] Copy rules from `storage.rules` file
- [ ] Paste and click **"Publish"**
- ⚠️ Note: You're using Cloudinary, so this is optional, but good to have for future use

## 🧪 Testing Checklist

After completing the above:

- [ ] Restart dev server: `npm run dev`
- [ ] Test Google login at `/login`
- [ ] Test admin panel at `/admin`
- [ ] Test Cloudinary upload:
  - Go to Admin > Content
  - Upload a thumbnail image
  - Upload a video file
  - Verify files appear in Cloudinary dashboard
- [ ] Verify URLs are saved to Firestore

## 📝 Quick Reference

### Your Current Configuration:

**Firebase:**
- Project ID: `mobilemediainteractions-912cd`
- Auth Domain: `mobilemediainteractions-912cd.firebaseapp.com`

**Cloudinary:**
- Cloud Name: `dd12ldrlh`
- API Key: `565396438571431`
- Upload Preset: `mmi-uploads` (or change to `MMI` if you update existing preset)

## 🚀 Next Steps Priority

1. **Fix Cloudinary preset** (change to Unsigned) - 2 minutes
2. **Enable Firebase Authentication** (Google) - 2 minutes
3. **Create Firestore Database** - 5 minutes
4. **Set Firestore Rules** - 2 minutes
5. **Test everything** - 5 minutes

**Total time: ~15 minutes to complete setup!**

---

**Once you fix the Cloudinary preset and complete Firebase setup, you're ready to go! 🎉**

