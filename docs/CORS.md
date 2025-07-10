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

## 🚀 Production Deployment Guide

### 1. Environment Configuration

**Required Environment Variables:**

```bash
# Production Environment
NODE_ENV=production
PORT=3000
DATABASE_URL=your_production_database_url
JWT_SECRET=your_secure_jwt_secret_256_bits_minimum
REFRESH_TOKEN_SECRET=your_secure_refresh_token_secret

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

### 2. Security Best Practices

**✅ DO:**

- Always use HTTPS in production
- Set specific allowed origins (never use `*` in production)
- Use strong, unique JWT secrets
- Enable credentials only when necessary
- Implement rate limiting
- Monitor CORS logs for unauthorized access attempts

**❌ DON'T:**

- Use `Access-Control-Allow-Origin: *` with credentials
- Allow HTTP origins in production
- Hard-code domains in source code
- Disable CORS entirely
- Allow development origins in production

### 3. Advanced Configuration

#### Multiple Environment Setup

```bash
# .env.development
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# .env.staging
NODE_ENV=staging
ALLOWED_ORIGINS=https://staging.yourdomain.com

# .env.production
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Dynamic Origin Validation

For more complex scenarios, you can modify `src/middleware/cors.ts`:

```typescript
// Custom origin validation function
const isOriginAllowed = (origin: string): boolean => {
  // Allow subdomains in production
  if (process.env.NODE_ENV === 'production') {
    return /^https:\/\/[a-zA-Z0-9.-]+\.yourdomain\.com$/.test(origin);
  }

  // Allow localhost in development
  return origin.startsWith('http://localhost:');
};
```

### 4. CDN and Proxy Configuration

#### CloudFlare Setup

If using CloudFlare, ensure these settings:

- **SSL/TLS**: Full (strict)
- **Always Use HTTPS**: On
- **Minimum TLS Version**: 1.2

#### Nginx Proxy Configuration

```nginx
location /api/ {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 5. Monitoring and Logging

#### Rate Limit Monitoring

Monitor these headers in your logs:

- `X-RateLimit-Limit`: Track usage patterns
- `X-RateLimit-Remaining`: Identify potential issues
- `X-Request-ID`: Trace specific requests

#### CORS Error Logging

Add logging to track CORS issues:

```typescript
// Add to cors middleware
if (!isAllowed) {
  console.warn(
    `CORS: Blocked origin ${origin} from ${c.req.header('X-Real-IP')}`
  );
}
```

### 6. Frontend Integration Guide

#### React/Next.js Integration

```javascript
// API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Fetch with proper CORS handling
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include', // Important for auth cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
```

#### Vue.js/Nuxt Integration

```javascript
// plugins/api.js
export default function ({ $axios, redirect }) {
  $axios.defaults.withCredentials = true;

  $axios.onError(error => {
    if (error.response?.status === 401) {
      redirect('/login');
    }
  });
}
```

### 7. Testing CORS Configuration

#### Manual Testing

```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:3000/api/users \
  -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v

# Test actual request
curl -X POST http://localhost:3000/api/users \
  -H "Origin: https://yourdomain.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -v
```

#### Automated Testing

```javascript
// CORS test example
describe('CORS Configuration', () => {
  test('should allow configured origins', async () => {
    const response = await fetch('/api/health', {
      headers: { Origin: 'https://yourdomain.com' },
    });

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://yourdomain.com'
    );
  });

  test('should block unauthorized origins', async () => {
    const response = await fetch('/api/health', {
      headers: { Origin: 'https://malicious.com' },
    });

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
```

### 8. Performance Optimization

#### Cache CORS Headers

```typescript
// Cache preflight responses for 24 hours
c.header('Access-Control-Max-Age', '86400');
```

#### Minimize Preflight Requests

- Use simple requests when possible
- Avoid custom headers if not necessary
- Use standard content types

### 9. Security Hardening

#### Content Security Policy (CSP)

```typescript
// Add to middleware
c.header(
  'Content-Security-Policy',
  "default-src 'self'; connect-src 'self' https://yourdomain.com"
);
```

#### Additional Security Headers

```typescript
c.header('X-Frame-Options', 'DENY');
c.header('X-Content-Type-Options', 'nosniff');
c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
```

### 10. Deployment Checklist

**Before deploying to production:**

- [ ] Environment variables configured
- [ ] HTTPS enabled and certificates valid
- [ ] CORS origins updated for production domains
- [ ] Rate limiting configured appropriately
- [ ] Security headers enabled
- [ ] CORS testing completed
- [ ] Monitoring and logging configured
- [ ] CDN/proxy CORS headers configured
- [ ] Frontend integration tested
- [ ] Error handling implemented

## 🔧 Quick Configuration Commands

### Update Production Origins

```bash
# Set environment variable
export ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# Or update .env file
echo "ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com" >> .env
```

### Restart with New Config

```bash
# Development
npm run dev

# Production with PM2
pm2 restart hono-server --update-env
```

## 📞 Support

For CORS-related issues:

1. Check the troubleshooting section above
2. Verify environment variables are set correctly
3. Test with browser developer tools Network tab
4. Check server logs for CORS warnings
5. Validate SSL certificates if using HTTPS
