import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { timeout } from 'hono/timeout';

import healthRoutes from './routes/health.js';
import userRoutes from './routes/users.js';

import {
  corsMiddleware,
  requestIdMiddleware,
  rateLimitMiddleware,
} from './middleware/cors.js';

const app = new Hono();

app.use('*', logger());
app.use('*', requestIdMiddleware);
app.use('*', timeout(30000));
app.use('*', secureHeaders());
app.use('*', corsMiddleware);
app.use('*', rateLimitMiddleware(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
app.use('*', prettyJSON());
app.use('*', prettyJSON());

app.get('/', c => {
  return c.json({
    message: 'Welcome to Hono API with Prisma',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      login: '/api/users/login',
      profile: '/api/users/profile',
      logout: '/api/users/logout',
      health: '/health',
    },
  });
});

app.route('/health', healthRoutes);
app.route('/api/users', userRoutes);

app.notFound(c => {
  return c.json(
    {
      success: false,
      error: 'Route not found',
      path: c.req.path,
    },
    404
  );
});

app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      success: false,
      error: 'Internal server error',
    },
    500
  );
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

serve(
  {
    fetch: app.fetch,
    port,
  },
  info => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
    console.log(`📖 Available endpoints:`);
    console.log(`   GET    /health           - Health check`);
    console.log(`   GET    /api/users        - Get all users`);
    console.log(`   POST   /api/users        - Create user`);
    console.log(`   POST   /api/users/login  - Login with email/password`);
    console.log(
      `   GET    /api/users/profile - Get user profile (requires auth)`
    );
    console.log(`   POST   /api/users/logout  - Logout user (requires auth)`);
    console.log(`   GET    /api/users/logout  - Logout user (requires auth)`);
    console.log(`🗄️  Database: PostgreSQL with Prisma ORM`);
  }
);
