# MMI Packages

Reusable packages and plugins for MobileMediaInteractions platforms.

## Available Packages

### @mmi/notifications

Plug-and-play notification system for all MMI platforms.

**Features:**
- One-line setup
- Simple API (send notifications in one line)
- Email and push notifications
- Template system
- Cross-platform support

**Installation:**
```bash
npm install @mmi/notifications
```

**Usage:**
```typescript
import { MMINotifications } from '@mmi/notifications';

// Setup (once)
MMINotifications.init({ firebaseConfig: {...} });

// Send notification (one line)
await MMINotifications.email('user@example.com', 'welcome');
```

See `packages/mmi-notifications/README.md` for full documentation.

## Development

To develop packages locally:

```bash
cd packages/mmi-notifications
npm install
npm run build
```

## Publishing

Packages can be published to npm or used as local packages:

```bash
# In package directory
npm publish
```

Or use as local package:
```json
{
  "dependencies": {
    "@mmi/notifications": "file:../packages/mmi-notifications"
  }
}
```

