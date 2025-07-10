import type { MiddlewareHandler } from 'hono';

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000', // React development server
  'http://localhost:3001', // Alternative React port
  'http://localhost:5173', // Vite development server
  'http://localhost:5174', // Alternative Vite port
  'http://localhost:8080', // General development port
  'https://your-domain.com', // Production domain (replace with actual)
  'https://www.your-domain.com', // Production www domain (replace with actual)
];

// Environment-based origins
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:*'); // Allow any localhost port in development
}

if (process.env.ALLOWED_ORIGINS) {
  const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin =>
    origin.trim()
  );
  allowedOrigins.push(...envOrigins);
}

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const origin = c.req.header('Origin');

  // Check if origin is allowed
  const isAllowed =
    !origin ||
    allowedOrigins.includes(origin) ||
    (process.env.NODE_ENV === 'development' &&
      origin.startsWith('http://localhost:'));

  if (isAllowed && origin) {
    c.header('Access-Control-Allow-Origin', origin);
  }

  c.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  c.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  await next();
};

// Request ID middleware for tracking requests
export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  await next();
};

// Rate limiting middleware (basic implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): MiddlewareHandler => {
  return async (c, next) => {
    const clientIp =
      c.req.header('CF-Connecting-IP') ||
      c.req.header('X-Forwarded-For') ||
      c.req.header('X-Real-IP') ||
      'unknown';

    const now = Date.now();
    const key = `rate_limit:${clientIp}`;

    let rateLimit = rateLimitStore.get(key);

    if (!rateLimit || now > rateLimit.resetTime) {
      rateLimit = { count: 0, resetTime: now + windowMs };
    }

    rateLimit.count++;
    rateLimitStore.set(key, rateLimit);

    // Clean up old entries periodically
    if (Math.random() < 0.1) {
      // 10% chance to clean up
      for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetTime) {
          rateLimitStore.delete(k);
        }
      }
    }

    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header(
      'X-RateLimit-Remaining',
      Math.max(0, maxRequests - rateLimit.count).toString()
    );
    c.header('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

    if (rateLimit.count > maxRequests) {
      return c.json(
        {
          success: false,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        429
      );
    }

    await next();
  };
};
