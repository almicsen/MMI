# 🔥 Firestore Rules Update - Admin User Access

## ⚠️ Issue Fixed

**Error**: "Missing or insufficient permissions" when accessing Users tab in admin panel.

**Problem**: The Firestore rules only allowed users to read their own documents, but the admin panel needs to read ALL users to display them.

## ✅ Solution

Updated the `users` collection rules to allow:
- ✅ **Admins can read all user documents** - For the admin panel
- ✅ **Admins can update any user** - For role management
- ✅ **Users can still read/update their own data** - Unchanged

## 📋 Updated Rules

```javascript
match /users/{userId} {
  // Users can read their own data, admins can read all users
  allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
  
  // Users can create their own document on first login
  allow create: if isAuthenticated() && request.auth.uid == userId;
  
  // Users can update their own document (but cannot change role), admins can update any user
  allow update: if isAuthenticated() && 
                 ((request.auth.uid == userId && 
                   (!('role' in request.resource.data) || 
                    request.resource.data.role == resource.data.role)) ||
                  isAdmin());
  
  // Only admins can delete user documents
  allow delete: if isAdmin();
}
```

## 🚀 Deploy Updated Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **mobilemediainteractions-912cd**
3. Click **Firestore Database** → **Rules** tab
4. Copy the updated rules from `firestore.rules`
5. Paste into Firebase Console
6. Click **Publish**

## ✅ After Deploying

- ✅ Admin panel Users tab will work
- ✅ Admins can view all users
- ✅ Admins can change user roles
- ✅ Users can still manage their own profiles
- ✅ Security is maintained (only admins can read all users)

## 🔒 Security Notes

- Only authenticated admins can read all users
- Regular users can only read their own data
- Role changes are restricted (users can't change their own role)
- Admins have full control for management purposes

**Deploy the updated rules and the Users tab will work!** 🎉

