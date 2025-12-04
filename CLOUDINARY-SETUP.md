# Cloudinary Setup Guide

Complete guide to set up Cloudinary for direct uploads from your admin panel.

## Step 1: Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up for Free"** (top right)
3. Fill in your details:
   - Email address
   - Password
   - Full name
4. Click **"Create Account"**
5. **No credit card required!**

## Step 2: Get Your Credentials

After signing up, you'll be taken to the Dashboard:

1. **Cloud Name**: 
   - Found at the top of the dashboard
   - Example: `dxyz123abc`
   - This is your unique Cloudinary account identifier

2. **API Key**:
   - Go to **Settings** (gear icon) → **Security**
   - Find **API Key** (visible by default)
   - Example: `123456789012345`

3. **API Secret**:
   - Same page as API Key
   - Click **"Reveal"** to show it
   - ⚠️ Keep this secret! Don't share it publicly
   - Example: `abcdefghijklmnopqrstuvwxyz123456`

## Step 3: Create Upload Preset

Upload presets allow direct uploads from the browser without exposing your API secret.

1. Go to **Settings** → **Upload** tab
2. Scroll to **"Upload presets"** section
3. Click **"Add upload preset"**
4. Configure the preset:
   - **Preset name**: `mmi-uploads` (or any name you prefer)
   - **Signing mode**: Select **"Unsigned"** (allows browser uploads)
   - **Folder**: `mmi` (optional, for organization)
   - **Upload manipulation**: 
     - For images: Enable **"Eager transformations"** → Add `f_auto,q_auto` (auto format, auto quality)
     - For videos: Same as images
   - **Access mode**: **"Public"** (so URLs are accessible)
5. Click **"Save"**

## Step 4: Add to Environment Variables

Add your Cloudinary credentials to `.env.local`:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=mmi-uploads
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Important:**
- Replace `your_cloud_name_here` with your actual cloud name
- Replace `your_api_key_here` with your actual API key
- Replace `mmi-uploads` with your upload preset name (if different)
- Replace `your_api_secret_here` with your actual API secret
- The API secret is only needed if you want to delete files server-side (optional)

### Example `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBL5yRLTB8vY9KQUItJez7Aaq-NvXR1X4w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mobilemediainteractions-912cd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mobilemediainteractions-912cd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mobilemediainteractions-912cd.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=38018812018
NEXT_PUBLIC_FIREBASE_APP_ID=1:38018812018:web:616b200d702888c2c19aeb
NEXT_PUBLIC_GA_ID=G-XNXFVQD4QV

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxyz123abc
NEXT_PUBLIC_CLOUDINARY_API_KEY=123456789012345
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=mmi-uploads
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## Step 5: Restart Development Server

After adding environment variables:

1. Stop your dev server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```

Environment variables are loaded when the server starts, so you must restart after adding them.

## Step 6: Test Upload

1. Go to your admin panel: `/admin`
2. Click **"Content"** tab
3. Try uploading:
   - A thumbnail image
   - A video file
4. Check that files upload successfully
5. Verify URLs are saved to Firestore

## Folder Structure in Cloudinary

Files will be organized in these folders:
- **Images**: `mmi/content/thumbnails/`
- **Videos**: `mmi/content/videos/`
- **Audio**: `mmi/content/audio/`
- **Coming Soon Thumbnails**: `mmi/coming-soon/thumbnails/`
- **Coming Soon Trailers**: `mmi/coming-soon/trailers/`

## Free Tier Limits

Your Cloudinary free tier includes:
- ✅ **25GB storage** - Plenty for ~10 users
- ✅ **25GB bandwidth/month** - Should be more than enough
- ✅ **25,000 transformations/month** - Auto-optimization uses these
- ✅ **Unlimited uploads** - No limit on number of files

## Monitoring Usage

1. Go to Cloudinary Dashboard
2. Check **"Usage"** section
3. See your current usage vs. free tier limits
4. Set up alerts if needed (Settings → Usage)

## Troubleshooting

### Error: "Cloudinary configuration missing"
- **Fix**: Check that all environment variables are set in `.env.local`
- **Fix**: Restart your dev server after adding variables

### Error: "Upload preset not found"
- **Fix**: Check that upload preset name matches in `.env.local`
- **Fix**: Verify preset is set to "Unsigned" mode

### Upload fails
- **Fix**: Check browser console for detailed error
- **Fix**: Verify file size is reasonable (free tier has limits)
- **Fix**: Check that file type is supported (images/videos)

### Images not displaying
- **Fix**: Check that URLs are being saved correctly to Firestore
- **Fix**: Verify URLs start with `https://res.cloudinary.com/`

## Security Notes

- ✅ **API Secret**: Only needed server-side (for deletions). Not exposed to browser.
- ✅ **Upload Preset**: Set to "Unsigned" allows browser uploads safely
- ✅ **Public URLs**: Files are public by default (needed for your app)
- ✅ **No Credit Card**: Free tier doesn't require payment method

## Next Steps

After setup:
1. ✅ Test uploading a thumbnail
2. ✅ Test uploading a video
3. ✅ Verify files appear in Cloudinary dashboard
4. ✅ Check that URLs are saved to Firestore
5. ✅ Test viewing content in your app

## Support

- Cloudinary Docs: [cloudinary.com/documentation](https://cloudinary.com/documentation)
- Cloudinary Support: Available in dashboard
- Free tier support: Community forums

---

**You're all set! Your admin panel can now upload files directly to Cloudinary without needing Firebase Storage or a credit card! 🎉**

