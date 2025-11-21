# Quick Guide: Copy Environment Variables to Vercel

You already have all your environment variables in `.env.local`. Here's how to copy them to Vercel:

## Method 1: Quick Copy (Recommended)

1. **Open your `.env.local` file** in your editor
2. **Go to Vercel Dashboard**: https://vercel.com/dashboard
3. **Select your project** → **Settings** → **Environment Variables**
4. **For each variable**, copy the name and value:

### Required Firebase Variables

From your `.env.local`, copy these:

- `NEXT_PUBLIC_FIREBASE_API_KEY` → Copy the value
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` → Copy the value
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` → Copy the value
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` → Copy the value
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` → Copy the value
- `NEXT_PUBLIC_FIREBASE_APP_ID` → Copy the value

### Optional Variables (if you have them)

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_API_KEY`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_GA_ID`

## Method 2: Use the Helper Script

Run this in your terminal:

```bash
bash .get-vercel-env.sh
```

This will display all your variables in a format ready to copy to Vercel.

## Steps in Vercel

For each variable:

1. Click **"Add New"** in Environment Variables
2. **Key**: Paste the variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
3. **Value**: Paste the value from your `.env.local`
4. **Environment**: Select all three:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. Click **Save**

## After Adding All Variables

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**

Your site should now work correctly! 🎉

---

**Note**: Your `.env.local` file is gitignored (as it should be), so these values are only on your local machine. You need to manually add them to Vercel.

