# MMI Notifications - Quick Start Guide

## One-Line Setup & Usage

### For This Project (Already Set Up)

The notification system is already integrated. Just use it:

```typescript
import { MMINotifications } from '@/lib/notifications';

// Send email (one line)
await MMINotifications.email('user@example.com', 'welcome');

// Send push notification (one line)
await MMINotifications.push('user-uid', 'new-content', { title: 'Episode 5' });

// Send both (one line)
await MMINotifications.notify('user@example.com', 'project-update', {
  projectName: 'Twisted Ties',
  status: 'In Progress',
});
```

### For Other MMI Platforms

Install the package:

```bash
npm install @mmi/notifications
```

Setup (one line):

```typescript
import { MMINotifications } from '@mmi/notifications';

MMINotifications.init({
  firebaseConfig: {
    apiKey: 'your-key',
    authDomain: 'your-domain',
    projectId: 'your-project',
    storageBucket: 'your-bucket',
    messagingSenderId: 'your-sender-id',
    appId: 'your-app-id',
  },
});
```

Use (one line):

```typescript
await MMINotifications.email('user@example.com', 'welcome');
```

## Built-in Templates

- `welcome` - Welcome new users
- `new-content` - New content available
- `project-update` - Project status change
- `upload-approved` - Upload approved
- `upload-rejected` - Upload needs changes
- `role-changed` - User role updated

## Real-World Examples

### When User Signs Up

```typescript
await MMINotifications.email(userEmail, 'welcome');
```

### When Content is Published

```typescript
await MMINotifications.notify(subscribers, 'new-content', {
  title: 'Episode 5: The Reveal',
});
```

### When Admin Changes User Role

```typescript
await MMINotifications.email(userEmail, 'role-changed', {
  role: 'employee',
});
```

### When Upload is Approved

```typescript
await MMINotifications.notify(employeeEmail, 'upload-approved', {
  title: 'Episode 3',
});
```

## That's It!

The notification system handles everything else:
- ✅ Stores notifications in Firestore
- ✅ Processes via Cloud Functions (to be set up)
- ✅ Sends via email/push services
- ✅ Tracks delivery status

See `docs/NOTIFICATIONS.md` for advanced usage.

