# Firestore Index for Site Notifications

If you see an error about a missing Firestore index when loading the MMI+ page or viewing notifications, you need to create a composite index.

## Error Message
If you see an error like:
```
The query requires an index. You can create it here: [URL]
```

## Create the Index

1. **Click the URL** provided in the error message (Firebase will automatically create the index for you)

OR

2. **Manually create the index**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to **Firestore Database** > **Indexes** tab
   - Click **Create Index**
   - Set:
     - **Collection ID**: `siteNotifications`
     - **Fields to index**:
       - `userId` (Ascending)
       - `createdAt` (Descending)
     - **Query scope**: Collection
   - Click **Create**

## Index Details

**Collection**: `siteNotifications`
**Fields**:
- `userId` (Ascending)
- `createdAt` (Descending)

This index is required for the query that fetches user notifications sorted by creation date.

## Note

The app now has error handling that will gracefully handle missing indexes, so the page won't crash. However, notifications won't load until the index is created.

