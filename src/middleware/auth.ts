import type { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

// JWT secret key - must match the one in user service
const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-variable';

// Define types for JWT payload
interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

// Extend Hono's Context to include the authenticated user
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

// JWT Authentication middleware
export const authMiddleware = async (c: Context, next: Next) => {
  // Get Authorization header
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(
      {
        success: false,
        error: 'Authentication required',
      },
      401
    );
  }

  // Extract token from header
  const token = authHeader.split(' ')[1];

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Attach user info to context for use in route handlers
    c.set('user', decoded);

    await next();
  } catch {
    return c.json(
      {
        success: false,
        error: 'Invalid or expired token',
      },
      401
    );
  }
};
