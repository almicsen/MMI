# 🔥 Firestore Indexes Setup Guide

## ⚠️ Current Error

**"The query requires an index. That index is currently building and cannot be used yet."**

This happens because Firestore needs **composite indexes** when you query with both `where()` and `orderBy()` clauses.

## ✅ Quick Fix (Easiest Method)

### Option 1: Click the Link (Recommended)
The error message provides a direct link to create the index. Simply:

1. **Click the URL** in the error message (it's a direct link to Firebase Console)
2. Firebase will automatically create the index
3. Wait a few minutes for it to build
4. Refresh your app - the error will be gone!

### Option 2: Manual Setup
If the link doesn't work, follow the steps below.

## 📋 Required Indexes

Based on your queries, you need these composite indexes:

### 1. **Content Collection**
- **Collection**: `content`
- **Fields**:
  - `published` (Ascending)
  - `createdAt` (Descending)
- **Query**: `where('published', '==', true)` + `orderBy('createdAt', 'desc')`

**Also needed if filtering by type:**
- **Collection**: `content`
- **Fields**:
  - `published` (Ascending)
  - `type` (Ascending)
  - `createdAt` (Descending)
- **Query**: `where('published', '==', true)` + `where('type', '==', type)` + `orderBy('createdAt', 'desc')`

### 2. **Series Collection**
- **Collection**: `series`
- **Fields**:
  - `published` (Ascending)
  - `createdAt` (Descending)
- **Query**: `where('published', '==', true)` + `orderBy('createdAt', 'desc')`

### 3. **Blog Posts Collection**
- **Collection**: `blogPosts`
- **Fields**:
  - `published` (Ascending)
  - `createdAt` (Descending)
- **Query**: `where('published', '==', true)` + `orderBy('createdAt', 'desc')`

### 4. **Pending Uploads Collection**
- **Collection**: `pendingUploads`
- **Fields**:
  - `status` (Ascending)
  - `createdAt` (Descending)
- **Query**: `where('status', '==', 'pending')` + `orderBy('createdAt', 'desc')`

## 🛠️ Manual Setup Steps

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select project: **mobilemediainteractions-912cd**

### Step 2: Navigate to Indexes
1. Click **Firestore Database** in left sidebar
2. Click **Indexes** tab at the top
3. Click **Create Index** button

### Step 3: Create Each Index

For each index above:

1. **Collection ID**: Enter the collection name (e.g., `content`)
2. **Add Fields**:
   - Click **Add field**
   - Enter field name (e.g., `published`)
   - Select query scope: **Collection**
   - Select order: **Ascending** (for `==` queries) or **Descending** (for `orderBy`)
3. **Add more fields** as needed
4. Click **Create**

### Step 4: Wait for Indexes to Build
- Indexes typically take **1-5 minutes** to build
- You'll see status: **Building** → **Enabled**
- Once enabled, the error will disappear!

## 🚀 Quick Setup (All at Once)

If you want to create all indexes quickly:

1. **Click the error link** - This creates the first needed index
2. **Run your app** - When you hit the next missing index, click that link too
3. **Repeat** until all indexes are created

Firebase will automatically detect missing indexes and provide links to create them!

## ✅ Verify Indexes

After creating indexes:

1. Go to **Firestore Database** → **Indexes** tab
2. You should see all indexes listed
3. Status should be **Enabled** (green checkmark)
4. If still **Building**, wait a few more minutes

## 🎯 What Queries Need Indexes?

Any query that combines:
- ✅ `where()` + `orderBy()` = **Needs index**
- ✅ `where()` + `where()` + `orderBy()` = **Needs index**
- ❌ Just `where()` = **No index needed**
- ❌ Just `orderBy()` = **No index needed** (if on `__name__` or single field)

## 📝 Current Queries That Need Indexes

Based on your code:

```javascript
// ✅ Needs index: content collection
where('published', '==', true) + orderBy('createdAt', 'desc')

// ✅ Needs index: content collection (with type filter)
where('published', '==', true) + where('type', '==', type) + orderBy('createdAt', 'desc')

// ✅ Needs index: series collection
where('published', '==', true) + orderBy('createdAt', 'desc')

// ✅ Needs index: blogPosts collection
where('published', '==', true) + orderBy('createdAt', 'desc')

// ✅ Needs index: pendingUploads collection
where('status', '==', 'pending') + orderBy('createdAt', 'desc')
```

## ⏱️ Index Building Time

- **Small collections** (< 1000 docs): ~1-2 minutes
- **Medium collections** (1K-10K docs): ~2-5 minutes
- **Large collections** (> 10K docs): ~5-15 minutes

## 🐛 Troubleshooting

### Index Still Building?
- Wait a few more minutes
- Check Firebase Console → Indexes tab
- Refresh your app

### Error Persists?
- Make sure you clicked the link and created the index
- Check that the index status is **Enabled** (not Building)
- Clear browser cache and refresh

### Multiple Indexes Needed?
- Create them one at a time
- Or click each error link as they appear
- Firebase will guide you to create each one

## 🎉 After Setup

Once all indexes are created and enabled:
- ✅ All queries will work
- ✅ No more index errors
- ✅ App will load content correctly
- ✅ Performance will be optimal

**The easiest way: Just click the link in the error message!** 🚀

