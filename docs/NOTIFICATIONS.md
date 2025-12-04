# MMI Notifications System

## Overview

The MMI Notifications system is a plug-and-play framework designed to work across all MobileMediaInteractions platforms. It provides a simple, one-line API for sending notifications via email and push.

## Quick Start

### Setup (One Line)

```typescript
import { MMINotifications } from '@/lib/notifications';

// Already initialized in this project via Firebase config
// For other projects, you'd do:
// MMINotifications.init({ firebaseConfig: {...} });
```

### Usage (One Line)

```typescript
// Send email
await MMINotifications.email('user@example.com', 'welcome');

// Send push notification
await MMINotifications.push('user-uid', 'new-content', { title: 'Episode 5' });

// Send both
await MMINotifications.notify('user@example.com', 'project-update', {
  projectName: 'Twisted Ties',
  status: 'In Progress',
});
```

## Built-in Templates

1. **welcome** - Welcome message for new users
2. **new-content** - New content available
3. **project-update** - Project status update
4. **upload-approved** - Content upload approved
5. **upload-rejected** - Content upload rejected
6. **role-changed** - User role change notification

## Custom Templates

Register your own templates:

```typescript
MMINotifications.registerTemplate('custom-name', {
  subject: 'Custom Subject: {{variable}}',
  body: 'Body with {{variable}}',
  html: '<h1>HTML with {{variable}}</h1>',
  pushTitle: 'Push Title',
  pushBody: 'Push body with {{variable}}',
});
```

## Integration Examples

### In Admin Dashboard

```typescript
// When approving an upload
await MMINotifications.email(userEmail, 'upload-approved', { title: uploadTitle });

// When changing user role
await MMINotifications.email(userEmail, 'role-changed', { role: newRole });
```

### In API Routes

```typescript
// app/api/notify/route.ts
import { MMINotifications } from '@/lib/notifications';

export async function POST(request: Request) {
  const { to, template, data } = await request.json();
  await MMINotifications.notify(to, template, data);
  return Response.json({ success: true });
}
```

## How It Works

1. **Notification Creation**: Notifications are stored in Firestore `notifications` collection
2. **Processing**: Firebase Cloud Functions process notifications (to be set up)
3. **Delivery**: 
   - Email: Via email service (SendGrid, Mailgun, etc.)
   - Push: Via Firebase Cloud Messaging

## Setting Up Cloud Functions

Create a Cloud Function to process notifications:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.processNotifications = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    if (notification.status !== 'pending') return;
    
    try {
      if (notification.type === 'email' || notification.type === 'both') {
        // Send email via your email service
        await sendEmailViaService(notification);
      }
      
      if (notification.type === 'push' || notification.type === 'both') {
        // Send push notification
        await sendPushNotification(notification);
      }
      
      // Update status
      await snap.ref.update({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp() });
    } catch (error) {
      await snap.ref.update({ status: 'failed', error: error.message });
    }
  });
```

## Cross-Platform Usage

This notification system is designed to work across:
- Web (Next.js, React)
- Mobile (React Native)
- Backend (Node.js)
- Other MMI platforms

The package `@mmi/notifications` can be published to npm and used in any project.

## Security

- Notifications are stored in Firestore with proper security rules
- Only authenticated users can create notifications
- Admin-only operations are protected
- Email addresses are validated

## Future Enhancements

- [ ] SMS notifications
- [ ] In-app notifications
- [ ] Notification preferences per user
- [ ] Scheduled notifications
- [ ] Notification analytics

