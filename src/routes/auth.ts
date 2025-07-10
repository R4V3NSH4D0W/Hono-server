import { Hono } from 'hono';
import { userService } from '../services/user-service.js';
import { authMiddleware, invalidateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

const authRoutes = new Hono();

// Register user
authRoutes.post('/register', async c => {
  try {
    const body = await c.req.json();
    if (!body.email || !body.name || !body.password)
      return c.json(
        {
          success: false,
          error: 'Missing required fields: email, name, password',
        },
        400
      );

    const existingUser = await userService.findByEmail(body.email);
    if (existingUser) {
      return c.json(
        {
          success: false,
          error: 'User with this email already exists',
        },
        409
      );
    }

    // Map 'name' to 'username' for the service
    const userData = {
      email: body.email,
      username: body.name,
      password: body.password,
      phone: body.phone || null,
      avatar: null,
    };

    const user = await userService.create(userData);
    return c.json(
      {
        success: true,
        data: user,
        message: 'User registered successfully',
      },
      201
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to register user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Login user
authRoutes.post('/login', async c => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        400
      );
    }

    const result = await userService.login(email, password);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error || 'Invalid credentials',
        },
        401
      );
    }

    return c.json(
      {
        success: true,
        data: result.data,
        message: 'Login successful',
      },
      200
    );
  } catch (error) {
    console.error('Login error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to login',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Logout user
authRoutes.post('/logout', authMiddleware, async c => {
  try {
    const token = c.get('token');

    invalidateToken(token);

    return c.json(
      {
        success: true,
        message: 'Logout successful',
      },
      200
    );
  } catch (error) {
    console.error('Error during logout:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to logout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Refresh token
authRoutes.post('/refresh-token', authMiddleware, async c => {
  try {
    const { userId, email, username, role } = c.get('user');

    // Generate new token with the same user data
    const JWT_SECRET = process.env.JWT_SECRET || 'JWT_TOKEN_SECRET_KEY';
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

    const newToken = jwt.sign(
      {
        userId,
        email,
        username,
        role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    return c.json(
      {
        success: true,
        data: {
          token: newToken,
          user: {
            id: userId,
            email,
            username,
            role,
          },
        },
        message: 'Token refreshed successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error refreshing token:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to refresh token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Forgot password
authRoutes.post('/forgot-password', async c => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json(
        {
          success: false,
          error: 'Email is required',
        },
        400
      );
    }

    // Check if user exists
    const user = await userService.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return c.json(
        {
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        },
        200
      );
    }

    // TODO: Implement password reset token generation and email sending
    // For now, we'll just return a success message
    console.log(`Password reset requested for email: ${email}`);

    return c.json(
      {
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      },
      200
    );
  } catch (error) {
    console.error('Error in forgot password:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to process password reset request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Reset password
authRoutes.post('/reset-password', async c => {
  try {
    const { token, newPassword } = await c.req.json();

    if (!token || !newPassword) {
      return c.json(
        {
          success: false,
          error: 'Reset token and new password are required',
        },
        400
      );
    }

    // TODO: Implement password reset token validation and password update
    // For now, we'll just return a placeholder response
    console.log(`Password reset attempted with token: ${token}`);

    return c.json(
      {
        success: false,
        error: 'Password reset functionality not yet implemented',
        message: 'This feature is coming soon',
      },
      501 // Not Implemented
    );
  } catch (error) {
    console.error('Error in reset password:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to reset password',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default authRoutes;
