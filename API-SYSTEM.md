# MMI API System Documentation

## Overview

The MMI API provides secure access to MobileMediaInteractions data and functionality. All API requests require authentication via API keys, and strict origin checking ensures only authorized sources can access the API.

## Security Features

### 1. API Key Authentication
- All requests require a valid API key
- Keys are hashed using SHA-256 before storage
- Keys can be scoped to specific permissions
- Keys can have expiration dates
- Keys can be revoked or deleted

### 2. Origin Checking
- By default, only requests from the site itself are allowed
- Admin can add allowed URLs to exempt specific domains
- Origin validation checks protocol, hostname, and port
- Supports subdomain matching

### 3. Scope-Based Permissions
- `read`: Read content and data
- `write`: Create and update content
- `notifications`: Send notifications
- `content`: Access content endpoints
- `*`: Full access (admin only)

### 4. Rate Limiting
- Configurable per API key
- Default: 1000 requests per hour
- Tracked and logged for monitoring

### 5. Usage Logging
- All API requests are logged
- Includes endpoint, method, status code, response time
- IP address and user agent tracking
- Available in admin panel for analytics

## API Endpoints

### Base URL
```
https://mobilemediainteractions.com/api/v1
```

### Authentication
Include your API key in the request header:
```
X-API-Key: your-api-key-here
```
or
```
Authorization: Bearer your-api-key-here
```

### Endpoints

#### GET /api/v1
Get API information and available endpoints.

**Authentication:** Optional

**Response:**
```json
{
  "name": "MMI API",
  "version": "1.0.0",
  "authenticated": true,
  "endpoints": {...},
  "scopes": ["read", "content"],
  "documentation": "/api/docs"
}
```

#### GET /api/v1/content
Get published content.

**Authentication:** Required (read or content scope)

**Query Parameters:**
- `type` (optional): Filter by type (`series`, `movie`, `podcast`)
- `seriesId` (optional): Get episodes for a specific series

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

#### POST /api/v1/notifications
Send a site notification.

**Authentication:** Required (notifications or write scope)

**Request Body:**
```json
{
  "userIds": ["user-id-1", "user-id-2"],
  "title": "Notification Title",
  "message": "Notification message",
  "type": "info",
  "link": "/path",
  "openInAppBrowser": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "recipients": 2
}
```

#### GET /api/v1/users
Get list of users (public data only).

**Authentication:** Required (read scope)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 5
}
```

## Error Responses

All errors are returned in JSON format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Codes

- `MISSING_API_KEY`: API key not provided
- `INVALID_API_KEY`: API key is invalid or expired
- `ORIGIN_NOT_ALLOWED`: Request origin is not in allowed list
- `INSUFFICIENT_SCOPES`: API key doesn't have required permissions
- `SERIES_NOT_FOUND`: Series ID not found
- `MISSING_USER_IDS`: userIds array is required
- `MISSING_FIELDS`: Required fields are missing
- `INTERNAL_ERROR`: Server error

## Admin Interface

### API Key Management

1. Navigate to Admin Panel → API Keys
2. Click "Create API Key"
3. Fill in:
   - Key Name
   - Scopes (select permissions)
   - Allowed URLs (optional, for external access)
   - Description (optional)
   - Expiration Date (optional)
4. Copy the generated key (shown only once)
5. Store the key securely

### Managing Keys

- **View**: See all your API keys with details
- **Stats**: View usage statistics for each key
- **Revoke**: Deactivate a key without deleting it
- **Delete**: Permanently remove a key

### Allowed URLs

Add URLs to the allowed list to exempt them from origin checking:
- Full URL format: `https://example.com`
- Protocol, hostname, and port must match
- Subdomains are automatically allowed

## SDK Integration

### JavaScript SDK

```html
<script src="https://mobilemediainteractions.com/sdk/mmiapi.js"></script>
<script>
  const api = new MMIApi('your-api-key-here');
  const content = await api.getContent();
</script>
```

### Node.js

```javascript
const MMIApi = require('./sdk/mmiapi.js');
const api = new MMIApi('your-api-key-here');
```

## Documentation

Full API documentation is available at:
- Web: `/api/docs`
- Interactive examples and code samples included

## Security Best Practices

1. **Never expose API keys in client-side code** (unless using allowed URLs)
2. **Use scoped keys** with minimal required permissions
3. **Set expiration dates** for temporary integrations
4. **Monitor usage** regularly for suspicious activity
5. **Revoke unused keys** immediately
6. **Use HTTPS** for all API requests
7. **Validate responses** on the client side

## Support

For API support or questions:
- Visit `/api/docs` for full documentation
- Check usage stats in the admin panel
- Review error codes for troubleshooting

