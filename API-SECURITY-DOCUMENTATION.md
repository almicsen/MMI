# API Security Documentation - NASA-Level Protection

## Overview

The MMI API implements comprehensive, multi-layered security measures designed to protect against a wide range of threats, from basic attacks to sophisticated exploits.

## Security Layers

### 1. Enhanced Security Middleware

**Location:** `lib/api/security-enhanced.ts`

**Features:**
- **IP Blacklisting/Whitelisting**: Block or allow specific IP addresses
- **IP Rate Limiting**: 100 requests per minute per IP (configurable)
- **Request Size Validation**: Maximum 10MB request body, 8KB headers
- **Request Fingerprinting**: Tracks IP, User-Agent, Accept-Language for anomaly detection
- **Suspicious Pattern Detection**: Identifies known attack tools (sqlmap, nikto, nmap, etc.)
- **Security Event Logging**: All security events logged to Firestore

### 2. API Key Authentication

**Features:**
- SHA-256 hashed keys (never stored in plaintext)
- Key expiration support
- Scope-based permissions
- Origin validation
- Active/inactive status

### 3. Rate Limiting

**Tier-Based Limits:**
- **Free**: 100 requests/hour
- **Starter**: 1,000 requests/hour
- **Business**: 10,000 requests/hour
- **Enterprise**: Custom (default 100,000/hour)

**IP-Based Limits:**
- 100 requests per minute per IP address
- Whitelisted IPs bypass this limit

### 4. Monthly Quota Management

**Tier-Based Quotas:**
- **Free**: 10,000 requests/month
- **Starter**: 100,000 requests/month
- **Business**: 1,000,000 requests/month
- **Enterprise**: Unlimited (with fair use)

**Features:**
- Automatic quota reset on 1st of each month
- Manual override support (temporary boosts)
- Real-time usage tracking

### 5. Input Validation & Sanitization

**Protections:**
- Null byte removal
- String length limits (10,000 characters)
- Prototype pollution prevention
- Deep object sanitization
- Type validation

### 6. Request Signature Validation (Optional)

**HMAC-SHA256 Signing:**
- Nonce-based (prevents replay attacks)
- Timestamp validation (5-minute window)
- Request body signing
- Method and path included in signature

**Usage:**
```javascript
// Generate nonce
const nonce = generateNonce();
const timestamp = Math.floor(Date.now() / 1000);

// Create signature
const signature = createRequestSignature(
  apiKey,
  'POST',
  '/api/v1/notifications',
  nonce,
  timestamp,
  JSON.stringify(requestBody)
);

// Include in headers
headers: {
  'X-API-Key': apiKey,
  'X-Signature': signature,
  'X-Nonce': nonce,
  'X-Timestamp': timestamp.toString()
}
```

### 7. Security Event Logging

**Logged Events:**
- Blocked requests (with reason)
- Suspicious activity
- Rate limit violations
- Quota exceeded
- Invalid API keys
- IP blacklist hits

**Storage:** Firestore `securityEvents` collection (admin-only access)

### 8. Anomaly Detection

**Monitored Patterns:**
- Unusual request volumes
- Suspicious User-Agents
- Geographic anomalies
- Request timing patterns
- Failed authentication attempts

## Security Headers

All API responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=63072000`

## Error Responses

All errors return JSON with:
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Codes:**
- `MISSING_API_KEY`: API key not provided
- `INVALID_API_KEY`: API key is invalid or expired
- `IP_BLACKLISTED`: IP address is blacklisted
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `QUOTA_EXCEEDED`: Monthly quota exceeded
- `ORIGIN_NOT_ALLOWED`: Origin not in allowed list
- `INSUFFICIENT_SCOPES`: API key lacks required scopes
- `REQUEST_TOO_LARGE`: Request exceeds size limits
- `INVALID_INPUT`: Request data validation failed
- `INVALID_NONCE`: Nonce validation failed (replay attack)
- `INVALID_SIGNATURE`: Request signature invalid

## Best Practices for API Users

1. **Store API Keys Securely**: Never commit keys to version control
2. **Use HTTPS**: Always use HTTPS for API requests
3. **Implement Retry Logic**: Handle rate limit errors gracefully
4. **Monitor Usage**: Track your API usage to avoid quota limits
5. **Use Request Signing**: For high-security applications, implement request signing
6. **Handle Errors**: Implement proper error handling for all error codes
7. **Respect Rate Limits**: Implement exponential backoff for rate limit errors

## Admin Security Features

### IP Management
- **Blacklist**: Block specific IPs from accessing the API
- **Whitelist**: Allow IPs to bypass rate limits
- **Firestore Collections**: `ipBlacklist`, `ipWhitelist`

### Security Monitoring
- View all security events in admin dashboard
- Filter by type (blocked, suspicious, allowed)
- Search by IP, endpoint, or reason
- Export security logs

### API Key Management
- View all API keys and their usage
- Suspend/revoke keys instantly
- Monitor quota usage
- Set manual overrides for temporary boosts

## Compliance

The API security system is designed to meet:
- **OWASP Top 10** protection
- **PCI DSS** requirements (for payment processing)
- **GDPR** compliance (data protection)
- **SOC 2** standards (security controls)

## Incident Response

In case of a security incident:
1. All events are automatically logged
2. Admins receive alerts for suspicious activity
3. IPs can be blacklisted instantly
4. API keys can be revoked immediately
5. Full audit trail available for investigation

## Security Updates

Security measures are continuously updated to protect against:
- New attack vectors
- Zero-day exploits
- DDoS attacks
- API abuse
- Data breaches

---

**Last Updated:** 2024
**Security Level:** Enterprise/NASA-Grade

