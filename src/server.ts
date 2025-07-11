import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { timeout } from 'hono/timeout';
import { serveStatic } from '@hono/node-server/serve-static';

import healthRoutes from './routes/health.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import authRoutes from './routes/auth.js';

import {
  corsMiddleware,
  requestIdMiddleware,
  rateLimitMiddleware,
} from './middleware/cors.js';

const app = new Hono();

app.use('*', logger());
app.use('*', corsMiddleware);
app.use('*', requestIdMiddleware);
app.use('*', timeout(30000));
app.use('*', secureHeaders());
app.use('*', rateLimitMiddleware(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
app.use('*', prettyJSON());

app.use('/uploads/*', serveStatic({ root: './public' }));
app.use(
  '/api/avatars/*',
  serveStatic({
    root: './public/avatars',
    rewriteRequestPath: path => path.replace('/api/avatars', ''),
  })
);
app.use(
  '/api/posts/*',
  serveStatic({
    root: './public/posts',
    rewriteRequestPath: path => path.replace('/api/posts', ''),
  })
);

app.get('/', c => {
  return c.json({
    message: 'Welcome to Hono API with Prisma',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        refreshToken: '/api/auth/refresh-token',
        forgotPassword: '/api/auth/forgot-password',
        resetPassword: '/api/auth/reset-password',
        validateResetToken: '/api/auth/reset-password/validate/:token',
      },
      users: {
        profile: {
          get: '/api/users/profile',
          update: '/api/users/profile',
        },
        addresses: {
          list: '/api/users/address',
          create: '/api/users/address',
          delete: '/api/users/address/:id',
        },
        admin: {
          getAllUsers: '/api/users/getAll',
        },
      },
      uploads: {
        avatar: '/api/uploads/avatar',
        postImages: '/api/uploads/post/:postId/images',
      },
      static: {
        avatars: '/api/avatars/{filename}',
        postImages: '/api/posts/{postId}/{filename}',
      },
      health: '/health',
    },
  });
});

app.route('/health', healthRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/uploads', uploadRoutes);

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
  }
);
