# Fixing 404 Error on Vercel

## Problem
You're getting a 404 error because Vercel was previously serving a single `index.html` file, and now it's trying to serve your Next.js app but the old file is interfering.

## Solution Applied

### 1. Moved Old `index.html`
- ✅ Moved `index.html` → `index.html.old` (backed up, won't interfere)
- ✅ Added `index.html.old` to `.gitignore` (won't be deployed)

### 2. Created `vercel.json`
- ✅ Added minimal Vercel config to ensure Next.js is detected correctly
- ✅ Vercel will now properly recognize this as a Next.js project

## Next Steps

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Fix: Remove old index.html, add Vercel config for Next.js"
git push
```

### 2. Verify in Vercel Dashboard
1. Go to your Vercel project
2. Check that the **Framework** is set to **Next.js**
3. If not, go to **Settings** → **General** → **Framework Preset** → Select **Next.js**

### 3. Redeploy
- Vercel should auto-deploy after you push
- Or manually trigger a redeploy from the dashboard

### 4. Check Build Logs
After deployment, check the build logs to ensure:
- ✅ Build completes successfully
- ✅ No errors about `index.html`
- ✅ Framework is detected as Next.js

## Expected Result

After deploying, you should see:
- ✅ Home page loads at `/`
- ✅ All routes work (`/about`, `/services`, `/blog`, etc.)
- ✅ No more 404 errors

## If Still Getting 404

1. **Check Vercel Project Settings**:
   - Go to **Settings** → **General**
   - Ensure **Framework Preset** is **Next.js**
   - Ensure **Root Directory** is `.` (root)

2. **Check Build Output**:
   - Look at the build logs
   - Should see: `✓ Compiled successfully`
   - Should see route list with `○` (static) and `ƒ` (dynamic)

3. **Clear Vercel Cache**:
   - Go to **Deployments**
   - Click the three dots on latest deployment
   - Click **Redeploy** (this clears cache)

4. **Verify Environment Variables**:
   - Make sure all Firebase env vars are set (see `COPY-TO-VERCEL.md`)
   - Build will fail if they're missing

## Files Changed

- ✅ `index.html` → `index.html.old` (moved, won't deploy)
- ✅ `vercel.json` (created, tells Vercel this is Next.js)
- ✅ `.gitignore` (updated to ignore old HTML file)

---

**The old `index.html` is backed up as `index.html.old` if you need it for reference, but it won't be deployed.**

