# MMI API SDK

JavaScript SDK for integrating with the MobileMediaInteractions API.

## Installation

### Browser (CDN)

```html
<script src="https://mobilemediainteractions.com/sdk/mmiapi.js"></script>
```

### npm

```bash
npm install @mmi/api-sdk
```

## Quick Start

```javascript
// Initialize the SDK
const api = new MMIApi('your-api-key-here');

// Get content
const content = await api.getContent();

// Get specific content type
const series = await api.getContent({ type: 'series' });

// Send a notification
await api.sendNotification({
  userIds: ['user-id-1', 'user-id-2'],
  title: 'New Content Available',
  message: 'Check out our latest episode!',
  type: 'info',
  link: '/mmi-plus/episode-5',
  openInAppBrowser: true,
});
```

## API Reference

### Constructor

```javascript
const api = new MMIApi(apiKey, baseUrl?)
```

- `apiKey` (string, required): Your API key
- `baseUrl` (string, optional): Base URL for the API (defaults to `https://mobilemediainteractions.com`)

### Methods

#### `getInfo()`

Get API information and available endpoints.

```javascript
const info = await api.getInfo();
```

#### `getContent(options?)`

Get published content.

**Options:**
- `type` (string, optional): Filter by type (`'series'`, `'movie'`, or `'podcast'`)
- `seriesId` (string, optional): Get episodes for a specific series

```javascript
// Get all content
const allContent = await api.getContent();

// Get only series
const series = await api.getContent({ type: 'series' });

// Get episodes for a series
const episodes = await api.getContent({ seriesId: 'series-id-123' });
```

#### `sendNotification(notification)`

Send a site notification to users.

**Notification object:**
- `userIds` (string[], required): Array of user IDs to notify
- `title` (string, required): Notification title
- `message` (string, required): Notification message
- `type` (string, optional): `'info'`, `'success'`, `'warning'`, or `'error'` (default: `'info'`)
- `link` (string, optional): URL to navigate when clicked
- `openInAppBrowser` (boolean, optional): Open link in in-app browser (default: `false`)

```javascript
await api.sendNotification({
  userIds: ['user-1', 'user-2'],
  title: 'Welcome!',
  message: 'Thanks for joining us!',
  type: 'success',
});
```

#### `getUsers()`

Get list of users (public data only).

```javascript
const users = await api.getUsers();
```

## Error Handling

All methods throw errors on failure. Handle them with try/catch:

```javascript
try {
  const content = await api.getContent();
} catch (error) {
  console.error('API Error:', error.message);
  // Error object includes:
  // - message: Human-readable error message
  // - code: Error code (e.g., 'UNAUTHORIZED', 'NOT_FOUND')
  // - timestamp: When the error occurred
}
```

## Security

- API keys are validated on every request
- Requests from unauthorized origins are rejected
- Add allowed URLs in the admin panel to exempt specific domains
- API keys can be scoped to specific permissions

## Support

For more information, visit the [API Documentation](/api/docs).

