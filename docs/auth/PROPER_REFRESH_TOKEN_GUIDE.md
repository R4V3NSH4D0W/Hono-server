# Proper Refresh Token Implementation Guide

## 🎯 **Industry Standard Refresh Token Pattern**

### **Concept Overview**

A proper refresh token system uses **two different types of tokens**:

1. **Access Token** (Short-lived: 15-30 minutes)
   - Used for API requests
   - Contains user permissions
   - Short expiration for security

2. **Refresh Token** (Long-lived: 7-30 days)
   - Used only to get new access tokens
   - Stored securely (database/Redis)
   - Can be revoked independently

### **Proper Implementation Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │   Auth Service   │    │    Database     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Login Request      │                       │
         ├──────────────────────►│                       │
         │                       │ 2. Validate User     │
         │                       ├──────────────────────►│
         │                       │ 3. User Valid        │
         │                       │◄──────────────────────┤
         │                       │ 4. Store Refresh Token│
         │                       ├──────────────────────►│
         │ 5. Access + Refresh   │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
         │ 6. API Request        │                       │
         │ (with Access Token)   │                       │
         ├──────────────────────►│                       │
         │ 7. Response           │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
         │ 8. Access Token Expired│                      │
         │ 9. Refresh Request    │                       │
         │ (with Refresh Token)  │                       │
         ├──────────────────────►│                       │
         │                       │ 10. Validate Refresh │
         │                       ├──────────────────────►│
         │                       │ 11. Token Valid      │
         │                       │◄──────────────────────┤
         │                       │ 12. Store New Refresh│
         │                       ├──────────────────────►│
         │                       │ 13. Invalidate Old   │
         │                       ├──────────────────────►│
         │ 14. New Access+Refresh│                       │
         │◄──────────────────────┤                       │
```

## 🏗️ **Implementation Steps**

### **1. Database Schema for Refresh Tokens**

```sql
-- Add to Prisma schema
model RefreshToken {
  id          String   @id @default(cuid())
  token       String   @unique
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  isRevoked   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Optional: Track device/session info
  deviceInfo  String?
  ipAddress   String?
  userAgent   String?

  @@map("refresh_tokens")
}

-- Update User model
model User {
  // ...existing fields...
  refreshTokens RefreshToken[]
}
```

### **2. Enhanced Auth Service**

```typescript
// src/services/auth-service.ts
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';

export const authService = {
  // Generate tokens pair
  generateTokenPair: async (user: any) => {
    const JWT_SECRET = process.env.JWT_SECRET!;
    const ACCESS_TOKEN_EXPIRES = '15m'; // Short-lived
    const REFRESH_TOKEN_EXPIRES = '7d'; // Long-lived

    // Create access token (short-lived)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    // Generate refresh token (random string)
    const refreshTokenValue = crypto.randomBytes(32).toString('hex');

    // Store refresh token in database
    const refreshToken = await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      accessTokenExpiresIn: ACCESS_TOKEN_EXPIRES,
      refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRES,
    };
  },

  // Refresh access token
  refreshAccessToken: async (refreshTokenValue: string) => {
    // Find and validate refresh token
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: true },
    });

    if (
      !refreshToken ||
      refreshToken.isRevoked ||
      refreshToken.expiresAt < new Date()
    ) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new token pair
    const tokens = await authService.generateTokenPair(refreshToken.user);

    // Invalidate old refresh token (token rotation)
    await prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { isRevoked: true },
    });

    return tokens;
  },

  // Revoke refresh token
  revokeRefreshToken: async (refreshTokenValue: string) => {
    await prisma.refreshToken.updateMany({
      where: { token: refreshTokenValue },
      data: { isRevoked: true },
    });
  },

  // Revoke all user's refresh tokens
  revokeAllUserTokens: async (userId: string) => {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  },
};
```

### **3. Updated Auth Routes**

```typescript
// Enhanced login endpoint
authRoutes.post('/login', async c => {
  try {
    const { email, password } = await c.req.json();

    // Validate credentials
    const result = await userService.login(email, password);
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }

    // Generate token pair
    const tokens = await authService.generateTokenPair(result.data.user);

    return c.json({
      success: true,
      data: {
        user: result.data.user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.accessTokenExpiresIn,
      },
      message: 'Login successful',
    });
  } catch (error) {
    // Handle error
  }
});

// Proper refresh token endpoint
authRoutes.post('/refresh-token', async c => {
  try {
    const { refreshToken } = await c.req.json();

    if (!refreshToken) {
      return c.json(
        {
          success: false,
          error: 'Refresh token required',
        },
        400
      );
    }

    // Refresh tokens
    const tokens = await authService.refreshAccessToken(refreshToken);

    return c.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.accessTokenExpiresIn,
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Invalid or expired refresh token',
      },
      401
    );
  }
});

// Enhanced logout endpoint
authRoutes.post('/logout', authMiddleware, async c => {
  try {
    const { refreshToken } = await c.req.json();
    const { userId } = c.get('user');

    // Revoke specific refresh token if provided
    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    } else {
      // Revoke all user's refresh tokens
      await authService.revokeAllUserTokens(userId);
    }

    return c.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    // Handle error
  }
});
```

### **4. Client-Side Implementation**

```typescript
// Client-side token management
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<any> | null = null;

  async login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.success) {
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;

      // Store refresh token securely (httpOnly cookie preferred)
      localStorage.setItem('refreshToken', this.refreshToken);
    }

    return data;
  }

  async getValidAccessToken(): Promise<string | null> {
    // If no access token, try to refresh
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }

    // Check if token is expired (decode JWT and check exp)
    if (this.isTokenExpired(this.accessToken)) {
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  private async refreshAccessToken() {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;

    return result;
  }

  private async performRefresh() {
    const refreshToken =
      this.refreshToken || localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (data.success) {
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      localStorage.setItem('refreshToken', this.refreshToken);
    } else {
      // Refresh failed, redirect to login
      this.logout();
      window.location.href = '/login';
    }

    return data;
  }

  private isTokenExpired(token: string | null): boolean {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  async apiRequest(url: string, options: RequestInit = {}) {
    const token = await this.getValidAccessToken();

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async logout() {
    const refreshToken =
      this.refreshToken || localStorage.getItem('refreshToken');

    if (refreshToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    }

    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('refreshToken');
  }
}
```

## 🔒 **Security Best Practices**

### **1. Token Storage**

- **Access Token**: Memory only (never localStorage)
- **Refresh Token**: Secure httpOnly cookie (preferred) or secure storage

### **2. Token Rotation**

- Invalidate old refresh token when issuing new one
- Detect token reuse attacks

### **3. Expiration Times**

- Access Token: 15-30 minutes
- Refresh Token: 7-30 days (depending on security requirements)

### **4. Additional Security**

- Track device/IP for refresh tokens
- Limit number of active refresh tokens per user
- Implement sliding window expiration
- Add rate limiting for refresh requests

## 📊 **Benefits of Proper Implementation**

1. **Security**: Short-lived access tokens limit damage from token theft
2. **User Experience**: Seamless token refresh without re-login
3. **Control**: Can revoke specific sessions/devices
4. **Monitoring**: Track token usage patterns
5. **Compliance**: Meets security standards for sensitive applications

## 🚀 **Migration Path**

To upgrade our current system:

1. Add `RefreshToken` model to Prisma schema
2. Create `auth-service.ts` with proper token management
3. Update auth routes to use new service
4. Update client applications to handle token pairs
5. Gradually migrate users to new token system

---

_This represents the industry standard for refresh token implementation_
