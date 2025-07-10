# CORS Configuration Guide

This server includes comprehensive CORS (Cross-Origin Resource Sharing) configuration to control which domains can access your API.

## Features

### 1. **Allowed Origins Configuration**

- **Development**: Automatically allows all `localhost` origins for local development
- **Production**: Uses environment variable `ALLOWED_ORIGINS` for specific domains
- **Predefined**: Common development ports (3000, 3001, 5173, 5174, 8080)

### 2. **Advanced Middleware Stack**

- **Request ID**: Adds unique `X-Request-ID` header to each request for tracking
- **Rate Limiting**: 100 requests per 15 minutes per IP address
- **Security Headers**: Adds security headers via `secureHeaders()` middleware
- **CORS**: Custom CORS handling with origin validation
- **Timeout**: 30-second request timeout protection

### 3. **CORS Headers**

- `Access-Control-Allow-Origin`: Dynamic based on request origin
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, PATCH, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization, X-Requested-With, Accept, Origin
- `Access-Control-Allow-Credentials`: true (allows cookies/auth headers)
- `Access-Control-Max-Age`: 86400 seconds (24 hours caching)

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```bash
# Development
NODE_ENV=development
PORT=3000

# Production CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

### Adding New Allowed Origins

1. **For Development**: No action needed - localhost is auto-allowed
2. **For Production**: Add domains to `ALLOWED_ORIGINS` environment variable
3. **Permanently**: Edit `src/middleware/cors.ts` and add to `allowedOrigins` array

## Usage Examples

### Frontend Fetch with Credentials

```javascript
fetch('http://localhost:3000/api/endpoint', {
  method: 'POST',
  credentials: 'include', // Important for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer your-token',
  },
  body: JSON.stringify(data),
});
```

### CORS Preflight Handling

The server automatically handles OPTIONS requests (preflight) and returns appropriate CORS headers.

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: When the rate limit resets

## Security Features

1. **IP Detection**: Supports CloudFlare, proxy headers for accurate IP detection
2. **Request Tracking**: Each request gets a unique ID for debugging
3. **Secure Headers**: HSTS, CSP, and other security headers automatically added
4. **Origin Validation**: Strict origin checking in production

## Troubleshooting

### Common CORS Issues

1. **"Access denied"**: Check if your domain is in allowed origins
2. **"Preflight failed"**: Ensure OPTIONS method is not blocked
3. **"Credentials blocked"**: Set `credentials: 'include'` in fetch requests

### Development Issues

1. **Localhost blocked**: Ensure `NODE_ENV=development` is set
2. **Different port**: Add your port to `allowedOrigins` array
3. **HTTPS/HTTP mismatch**: Ensure protocol matches between frontend/backend
