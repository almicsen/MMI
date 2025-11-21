# Fix: Firebase Unauthorized Domain Error

## Error
```
Firebase: Error (auth/unauthorized-domain)
```

## Cause
Your Vercel deployment domain isn't authorized in Firebase Authentication. Firebase only allows authentication from domains you explicitly authorize.

## Solution: Add Vercel Domain to Firebase

### Step 1: Get Your Vercel Domain

Your Vercel domain will be one of:
- `your-project.vercel.app` (default)
- `your-project-git-main.vercel.app` (preview)
- Your custom domain (if you set one up)

**To find it:**
1. Go to your Vercel Dashboard
2. Click on your project
3. Look at the **Domains** section
4. Copy the domain (e.g., `mmi-app.vercel.app`)

### Step 2: Add Domain to Firebase

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `mobilemediainteractions-912cd`
3. **Go to Authentication**:
   - Click **Authentication** in the left sidebar
   - Click **Settings** tab (gear icon)
   - Scroll down to **Authorized domains**

4. **Add Your Vercel Domain**:
   - Click **Add domain**
   - Enter your Vercel domain (e.g., `your-project.vercel.app`)
   - **Important**: Don't include `https://` or trailing slashes
   - Just the domain: `your-project.vercel.app`
   - Click **Add**

5. **Add Preview Domains** (if using):
   - Also add: `your-project-git-main.vercel.app`
   - And: `your-project-git-*-*.vercel.app` (for branch previews)

6. **Add Custom Domain** (if you have one):
   - If you set up a custom domain, add that too
   - Example: `yourdomain.com`

### Step 3: Verify

After adding the domain:
- ✅ Wait a few seconds for changes to propagate
- ✅ Refresh your Vercel site
- ✅ Try logging in again
- ✅ The error should be gone

## Common Domains to Add

Based on your setup, you'll likely need:

```
your-project.vercel.app          (Production)
your-project-git-main.vercel.app  (Main branch preview)
*.vercel.app                      (All preview deployments - optional)
your-custom-domain.com            (If you have one)
localhost                         (Already there for local dev)
```

## Quick Checklist

- [ ] Found your Vercel domain
- [ ] Went to Firebase Console → Authentication → Settings
- [ ] Added production domain (`*.vercel.app` or specific domain)
- [ ] Added preview domain (if needed)
- [ ] Added custom domain (if you have one)
- [ ] Waited a few seconds
- [ ] Tested login on Vercel site

## Example

If your Vercel project is `mmi-app`, you'd add:
- `mmi-app.vercel.app`
- `mmi-app-git-main.vercel.app`

## Still Not Working?

1. **Check Domain Format**:
   - ✅ Correct: `your-project.vercel.app`
   - ❌ Wrong: `https://your-project.vercel.app`
   - ❌ Wrong: `your-project.vercel.app/`

2. **Wait for Propagation**:
   - Changes can take 1-2 minutes to propagate
   - Try clearing browser cache

3. **Check All Domains**:
   - Make sure you added the exact domain from Vercel
   - Check for typos

4. **Verify Firebase Project**:
   - Make sure you're editing the correct Firebase project
   - Check that your `.env.local` matches the project

---

**After adding your Vercel domain, authentication should work!** 🎉

