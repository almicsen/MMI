# 🔐 How to Enable Admin Status

## Quick Method: Firebase Console (Recommended)

Since you need admin access to use the admin panel, you'll need to manually set your role in Firebase Console first.

### Step 1: Find Your User ID
1. **Login to your app** at http://localhost:3000/login
2. **Open browser console** (F12 or Cmd+Option+I)
3. **Check your user ID** - You can find it by:
   - Looking at the URL after login
   - Or checking the browser's Application/Storage tab → Firebase Auth
   - Or run this in console: `firebase.auth().currentUser.uid` (if Firebase is exposed)

**Easier way**: Check the Network tab in DevTools after logging in, look for Firestore requests to see your user ID.

### Step 2: Update Role in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **mobilemediainteractions-912cd**
3. Click **Firestore Database** in left sidebar
4. Click **Data** tab
5. Find the **`users`** collection
6. Click on **your user document** (the one with your user ID)
7. Find the **`role`** field
8. Change value from `guest` to `admin`
9. Click **Update**

### Step 3: Refresh Your App
1. **Logout** from your app (if logged in)
2. **Login again** with Google
3. You should now see **"Admin"** in the header
4. You can now access `/admin` page!

## Alternative: Using Firebase Console Query

If you know your email:

1. Go to **Firestore Database** → **Data** tab
2. Click on **`users`** collection
3. Find your user document (by email)
4. Edit the `role` field to `admin`
5. Save

## Verify Admin Status

After updating:

1. **Logout and login again** (to refresh auth state)
2. Check the header - should show **"Admin"** link
3. Visit `/admin` - should load the admin panel
4. In admin panel → **Users** tab - you can now manage other users' roles

## Using Admin Panel (After Setup)

Once you're an admin, you can manage user roles from the admin panel:

1. Go to `/admin`
2. Click **Users** tab
3. Find any user
4. Change their role using the dropdown
5. Changes save automatically

## Roles Available

- **`guest`** - Default role, can view public content
- **`employee`** - Can upload content to assigned series
- **`admin`** - Full access to CMS and user management

## Troubleshooting

### Can't find my user document?
- Make sure you've logged in at least once
- Check that you're looking in the `users` collection
- Your document ID should match your Firebase Auth UID

### Role changed but still can't access admin?
- **Logout and login again** - Auth state needs to refresh
- Clear browser cache
- Check that the `role` field is exactly `admin` (lowercase, no quotes in the value)

### Want to check your current role?
- Visit `/profile` page - it shows your current role
- Or check browser console: The auth context should log your user data

## Quick Script (Advanced)

If you want to do it programmatically, you can run this in browser console (after logging in):

```javascript
// Get your user ID
const user = firebase.auth().currentUser;
console.log('Your User ID:', user.uid);

// Then manually update in Firebase Console using that ID
```

## 🎉 After Setup

Once you're an admin:
- ✅ Access `/admin` panel
- ✅ Manage all content
- ✅ Manage user roles
- ✅ View analytics
- ✅ Configure player settings
- ✅ Manage coming soon content

**The easiest way: Just edit the `role` field in Firebase Console!** 🚀

