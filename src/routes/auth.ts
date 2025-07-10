import { Hono } from 'hono';
import { userService } from '../services/user-service.js';
import { passwordResetService } from '../services/password-reset-service.js';
import { emailService } from '../services/email-service.js';
import { authService } from '../services/auth-service.js';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

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

    if (!result.success || !result.data) {
      return c.json(
        {
          success: false,
          error: result.error || 'Invalid credentials',
        },
        401
      );
    }

    // Generate tokens using auth service
    const deviceInfo = authService.extractDeviceInfo(c.req.header());
    const tokens = await authService.generateTokenPair(
      result.data.user,
      deviceInfo
    );

    return c.json(
      {
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.accessTokenExpiresIn,
          user: result.data.user,
        },
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
    const user = c.get('user');

    // Revoke all refresh tokens for this user
    await authService.revokeAllUserTokens(user.userId);

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
authRoutes.post('/refresh-token', async c => {
  try {
    const { refreshToken } = await c.req.json();

    if (!refreshToken) {
      return c.json(
        {
          success: false,
          error: 'Refresh token is required',
        },
        400
      );
    }

    // Use auth service to refresh tokens
    const deviceInfo = authService.extractDeviceInfo(c.req.header());

    // Get the refresh token record to access user data
    const refreshTokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !refreshTokenRecord ||
      refreshTokenRecord.isRevoked ||
      refreshTokenRecord.expiresAt < new Date()
    ) {
      return c.json(
        {
          success: false,
          error: 'Invalid or expired refresh token',
        },
        401
      );
    }

    const newTokens = await authService.refreshAccessToken(
      refreshToken,
      deviceInfo
    );

    return c.json(
      {
        success: true,
        data: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresIn: newTokens.accessTokenExpiresIn,
          user: {
            id: refreshTokenRecord.user.id,
            email: refreshTokenRecord.user.email,
            username: refreshTokenRecord.user.username,
            role: refreshTokenRecord.user.role,
          },
        },
        message: 'Token refreshed successfully',
      },
      200
    );
  } catch (error) {
    console.error('Error refreshing token:', error);

    if (error instanceof Error) {
      // Handle specific refresh token errors
      if (
        error.message.includes('Invalid') ||
        error.message.includes('expired')
      ) {
        return c.json(
          {
            success: false,
            error: 'Invalid or expired refresh token',
          },
          401
        );
      }
    }

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

    try {
      // Generate password reset token
      const resetToken = await passwordResetService.generateResetToken(user.id);

      // Send password reset email
      await emailService.sendPasswordResetEmail(
        user.email,
        user.username,
        resetToken
      );

      console.log(`Password reset token generated for ${email}: ${resetToken}`);

      return c.json(
        {
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        },
        200
      );
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);

      // Still return success to not reveal if email exists
      return c.json(
        {
          success: true,
          message: 'If the email exists, a password reset link has been sent',
        },
        200
      );
    }
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

    // Validate password strength
    if (newPassword.length < 6) {
      return c.json(
        {
          success: false,
          error: 'Password must be at least 6 characters long',
        },
        400
      );
    }

    try {
      // Reset the password using the token
      const result = await passwordResetService.resetPassword(
        token,
        newPassword
      );

      return c.json(
        {
          success: true,
          data: {
            user: {
              id: result.user.id,
              email: result.user.email,
              username: result.user.username,
            },
          },
          message: 'Password has been reset successfully',
        },
        200
      );
    } catch (resetError) {
      console.error('Password reset error:', resetError);

      return c.json(
        {
          success: false,
          error:
            resetError instanceof Error
              ? resetError.message
              : 'Invalid or expired reset token',
        },
        400
      );
    }
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

// Change password (for authenticated users who know their current password)
authRoutes.post('/change-password', authMiddleware, async c => {
  try {
    const { currentPassword, newPassword } = await c.req.json();
    const user = c.get('user');

    // Validate input
    if (!currentPassword || !newPassword) {
      return c.json(
        {
          success: false,
          error: 'Current password and new password are required',
        },
        400
      );
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return c.json(
        {
          success: false,
          error: 'New password must be at least 6 characters long',
        },
        400
      );
    }

    try {
      // Get user with password from database
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, email: true, username: true, password: true },
      });

      if (!userWithPassword) {
        return c.json(
          {
            success: false,
            error: 'User not found',
          },
          404
        );
      }

      // Verify current password
      const isCurrentValid = await bcrypt.compare(
        currentPassword,
        userWithPassword.password
      );
      if (!isCurrentValid) {
        return c.json(
          {
            success: false,
            error: 'Current password is incorrect',
          },
          400
        );
      }

      // Check if new password is different from current
      const isSame = await bcrypt.compare(
        newPassword,
        userWithPassword.password
      );
      if (isSame) {
        return c.json(
          {
            success: false,
            error: 'New password must be different from current password',
          },
          400
        );
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      return c.json(
        {
          success: true,
          message: 'Password changed successfully',
        },
        200
      );
    } catch (changeError) {
      console.error('Password change error:', changeError);
      return c.json(
        {
          success: false,
          error: 'Failed to change password',
        },
        500
      );
    }
  } catch (error) {
    console.error('Error in change password:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to change password',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// Validate reset token (useful for frontend to check token validity)
authRoutes.get('/reset-password/validate/:token', async c => {
  try {
    const token = c.req.param('token');

    if (!token) {
      return c.json(
        {
          success: false,
          error: 'Reset token is required',
        },
        400
      );
    }

    try {
      const resetToken = await passwordResetService.validateResetToken(token);

      return c.json(
        {
          success: true,
          data: {
            valid: true,
            expiresAt: resetToken.expiresAt,
            user: {
              email: resetToken.user.email,
            },
          },
          message: 'Reset token is valid',
        },
        200
      );
    } catch (validationError) {
      return c.json(
        {
          success: false,
          data: {
            valid: false,
          },
          error:
            validationError instanceof Error
              ? validationError.message
              : 'Invalid reset token',
        },
        400
      );
    }
  } catch (error) {
    console.error('Error validating reset token:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to validate reset token',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default authRoutes;
