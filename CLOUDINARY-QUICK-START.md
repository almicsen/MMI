# Cloudinary Quick Start - Your Credentials Are Set!

Your Cloudinary credentials have been added to `.env.local`. Here's what you need to do next:

## ✅ Already Done

- [x] Cloudinary account created
- [x] Credentials added to `.env.local`:
  - Cloud name: `dd12ldrlh`
  - API key: `565396438571431`
  - API secret: `1go0Wmm2Zmv-wvcOHtFj0JgNIhY`

## 🔧 Next Step: Create Upload Preset

You need to create an upload preset to allow direct uploads from the browser:

### Step 1: Go to Upload Settings
1. In Cloudinary Dashboard, go to **Settings** (gear icon)
2. Click **"Upload"** tab
3. Scroll to **"Upload presets"** section

### Step 2: Create Preset
1. Click **"Add upload preset"**
2. Configure:
   - **Preset name**: `mmi-uploads` (must match `.env.local`)
   - **Signing mode**: Select **"Unsigned"** ⚠️ (This is critical!)
   - **Folder**: `mmi` (optional, for organization)
   - **Access mode**: **"Public"**
   - **Eager transformations** (optional):
     - For images: Add `f_auto,q_auto` (auto format, auto quality)
     - For videos: Add `f_auto,q_auto`
3. Click **"Save"**

### Why "Unsigned"?
- Allows direct uploads from browser (admin panel)
- Doesn't expose your API secret to the client
- Required for our implementation

## 🚀 Test It

1. **Restart your dev server:**
   ```bash
   # Stop server (Ctrl+C) then:
   npm run dev
   ```

2. **Test upload:**
   - Go to `/admin` → **Content** tab
   - Try uploading a thumbnail image
   - Try uploading a video file
   - Check browser console for any errors

3. **Verify:**
   - Files should upload to Cloudinary
   - URLs should be saved to Firestore
   - Check Cloudinary Dashboard → Media Library to see uploaded files

## 📁 Where Files Are Stored

Files will be organized in Cloudinary:
- **Content thumbnails**: `mmi/content/thumbnails/`
- **Content videos**: `mmi/content/videos/`
- **Content audio**: `mmi/content/audio/`
- **Coming Soon thumbnails**: `mmi/coming-soon/thumbnails/`
- **Coming Soon trailers**: `mmi/coming-soon/trailers/`
- **Employee uploads**: `mmi/employee-uploads/`

## ⚠️ Troubleshooting

### "Upload preset not found"
- **Fix**: Make sure preset name is exactly `mmi-uploads`
- **Fix**: Verify preset is set to "Unsigned" mode
- **Fix**: Check that preset is saved

### "Cloudinary configuration missing"
- **Fix**: Restart dev server after adding credentials
- **Fix**: Check `.env.local` has all Cloudinary variables

### Upload fails
- **Fix**: Check browser console for detailed error
- **Fix**: Verify file size is reasonable
- **Fix**: Check that file type is supported (images/videos)

## 🎉 You're Ready!

Once you create the upload preset, you can start uploading files directly from your admin panel!

**No credit card needed, completely free!** 🚀

