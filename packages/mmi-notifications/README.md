# @mmi/notifications

Plug-and-play notification system for MobileMediaInteractions platforms.

## Features

- ✅ **One-line setup** - Initialize in seconds
- ✅ **Simple API** - Send notifications with minimal code
- ✅ **Multiple channels** - Email, Push, or both
- ✅ **Template system** - Pre-built templates with variable substitution
- ✅ **Firebase integration** - Works seamlessly with Firebase
- ✅ **Cross-platform** - Use across all MMI platforms

## Installation

```bash
npm install @mmi/notifications
```

## Quick Start

### 1. Setup (One Line)

```typescript
import { MMINotifications } from '@mmi/notifications';

// Initialize once in your app
MMINotifications.init({
  firebaseConfig: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'your-sender-id',
    appId: 'your-app-id',
  },
  vapidKey: 'your-vapid-key', // Optional, for push notifications
});
```

### 2. Send Notifications (One Line)

```typescript
// Send email
await MMINotifications.email('user@example.com', 'welcome');

// Send push notification
await MMINotifications.push('user-uid', 'new-content', { title: 'New Episode' });

// Send both email and push
await MMINotifications.notify('user@example.com', 'project-update', {
  projectName: 'Twisted Ties',
  status: 'In Progress',
});
```

## API Reference

### Initialization

```typescript
MMINotifications.init(config: NotificationConfig): void
```

Initialize the notification system. Call this once when your app starts.

### Send Notifications

```typescript
// Full control
MMINotifications.send(options: NotificationOptions): Promise<void>

// Quick methods
MMINotifications.email(to: string | string[], template: string, data?: object): Promise<void>
MMINotifications.push(to: string | string[], template: string, data?: object): Promise<void>
MMINotifications.notify(to: string | string[], template: string, data?: object): Promise<void>
```

### Register Custom Templates

```typescript
MMINotifications.registerTemplate('custom-template', {
  subject: 'Custom Subject',
  body: 'Hello {{name}}!',
  html: '<h1>Hello {{name}}!</h1>',
  pushTitle: 'Custom Title',
  pushBody: 'Hello {{name}}!',
});
```

### Push Notifications

```typescript
// Request permission and get token
const token = await MMINotifications.requestPermission();

// Listen for foreground messages
MMINotifications.onMessage((payload) => {
  console.log('Received notification:', payload);
});
```

## Built-in Templates

- `welcome` - Welcome message for new users
- `new-content` - New content available notification
- `project-update` - Project status update
- `upload-approved` - Content upload approved
- `upload-rejected` - Content upload rejected
- `role-changed` - User role change notification

## Template Variables

Use `{{variableName}}` in templates, then pass data:

```typescript
MMINotifications.email('user@example.com', 'new-content', {
  title: 'Episode 5',
  series: 'Twisted Ties',
});
```

## Examples

### React/Next.js

```typescript
// app/layout.tsx or _app.tsx
import { MMINotifications } from '@mmi/notifications';

MMINotifications.init({
  firebaseConfig: {
    // ... your config
  },
});

// In a component
import { MMINotifications } from '@mmi/notifications';

async function handleUploadApproved(userEmail: string, title: string) {
  await MMINotifications.email(userEmail, 'upload-approved', { title });
}
```

### Node.js/Backend

```typescript
import { MMINotifications } from '@mmi/notifications';

// Initialize once
MMINotifications.init({
  firebaseConfig: { /* ... */ },
});

// Send notification
await MMINotifications.notify('user@example.com', 'project-update', {
  projectName: 'New Project',
  status: 'Completed',
});
```

## Integration with Firebase Cloud Functions

The notifications are stored in Firestore. You can set up Cloud Functions to process them:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.processNotifications = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    
    if (notification.type === 'email' || notification.type === 'both') {
      // Send email via your email service
      await sendEmail(notification);
    }
    
    if (notification.type === 'push' || notification.type === 'both') {
      // Send push notification
      await sendPushNotification(notification);
    }
  });
```

## License

MIT

