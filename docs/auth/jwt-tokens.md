# 🔐 JWT and Refresh Token Implementation

This guide provides a comprehensive understanding of how JWT (JSON Web Tokens) and refresh tokens work in our authentication system, with practical implementation details and security considerations.

## 🎯 What You'll Master

By the end of this guide, you'll understand:
- How JWT tokens are structured and validated
- The refresh token mechanism and rotation strategy
- Token lifecycle management
- Security best practices for token handling
- Implementation patterns for different scenarios

## 📖 The Token Story

### **The Evolution of Authentication**

**Traditional Sessions (Old Way)**
```
User Login → Server creates session → Session ID in cookie → Server memory storage
```
❌ **Problems**: Memory usage, scalability issues, server-side state

**JWT Tokens (Modern Way)**
```
User Login → Server creates JWT → Token sent to client → Stateless verification
```
✅ **Benefits**: Stateless, scalable, cross-domain support

**JWT + Refresh Tokens (Our Way)**
```
User Login → Two tokens created → Short-lived access + Long-lived refresh → Secure rotation
```
✅ **Best of Both**: Security + User experience + Scalability

## 🏗️ Token Architecture Deep Dive

### **Access Token Structure**

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "cm123456789",
    "email": "user@example.com",
    "username": "John Doe",
    "role": "USER",
    "type": "access",
    "iat": 1652164431,
    "exp": 1652165331
  },
  "signature": "HMACSHA256(base64UrlEncode(header) + '.' + base64UrlEncode(payload), secret)"
}
```

**Field Explanations:**
- `userId`: Unique user identifier
- `email`: User's email address
- `username`: Display name
- `role`: User permissions (USER, ADMIN, MODERATOR)
- `type`: Token type identifier
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp

### **Refresh Token Database Schema**

```sql
CREATE TABLE refresh_tokens (
    id VARCHAR PRIMARY KEY,
    token VARCHAR UNIQUE NOT NULL,
    user_id VARCHAR NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    device_info VARCHAR,
    ip_address VARCHAR,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Why Database Storage?**
- Centralized revocation control
- Audit trail for security
- Session management capabilities
- Scalable across multiple servers

## 🔄 Token Lifecycle Management

### **1. Token Generation Process**

```typescript
// Our implementation
const generateTokenPair = async (user: UserData, tokenInfo?: RefreshTokenInfo) => {
  // Create access token (JWT)
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Create refresh token (random secure hash)
  const refreshTokenValue = crypto.randomBytes(32).toString('hex');
  
  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo: tokenInfo?.deviceInfo,
      ipAddress: tokenInfo?.ipAddress,
      userAgent: tokenInfo?.userAgent
    }
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    accessTokenExpiresIn: '15m',
    refreshTokenExpiresIn: '7d'
  };
};
```

### **2. Token Validation Process**

```typescript
// Access token validation
const validateAccessToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    // Check token type
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    // Token is valid, return user info
    return {
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Refresh token validation
const validateRefreshToken = async (refreshToken: string) => {
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true }
  });

  if (!tokenRecord) {
    throw new Error('Invalid refresh token');
  }

  if (tokenRecord.isRevoked) {
    throw new Error('Refresh token has been revoked');
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new Error('Refresh token has expired');
  }

  return tokenRecord;
};
```

### **3. Token Refresh Process (Rotation)**

```typescript
const refreshAccessToken = async (refreshTokenValue: string, tokenInfo?: RefreshTokenInfo) => {
  // Validate refresh token
  const refreshToken = await validateRefreshToken(refreshTokenValue);
  
  // Generate new token pair
  const newTokens = await generateTokenPair(refreshToken.user, tokenInfo);
  
  // Invalidate old refresh token (rotation for security)
  await prisma.refreshToken.update({
    where: { id: refreshToken.id },
    data: { isRevoked: true }
  });
  
  return newTokens;
};
```

## 🛡️ Security Implementation

### **Token Rotation Strategy**

```
Login → Token Pair A
  ↓
Access Token A expires → Refresh with Token A → New Token Pair B (Token A invalidated)
  ↓
Access Token B expires → Refresh with Token B → New Token Pair C (Token B invalidated)
```

**Why Rotation?**
- Prevents token replay attacks
- Limits damage if refresh token is compromised
- Provides audit trail of token usage
- Enables detection of token theft

### **Security Headers Implementation**

```typescript
// In our middleware
app.use('*', (c, next) => {
  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  return next();
});
```

### **Rate Limiting for Token Endpoints**

```typescript
// Special rate limiting for auth endpoints
const authRateLimit = rateLimitMiddleware(10, 15 * 60 * 1000); // 10 requests per 15 minutes

authRoutes.post('/login', authRateLimit, loginHandler);
authRoutes.post('/refresh-token', authRateLimit, refreshHandler);
```

## 🎯 Frontend Integration Patterns

### **React Hook for Token Management**

```typescript
const useAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        
        // Store refresh token securely
        localStorage.setItem('refreshToken', data.data.refreshToken);
        
        return { success: true, user: data.data.user };
      }

      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();

      if (data.success) {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        return true;
      }

      // Refresh failed, logout user
      logout();
      return false;
    } catch (error) {
      logout();
      return false;
    }
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem('refreshToken');
    }
  };

  return { accessToken, user, login, logout, refreshToken, loading };
};
```

### **Axios Interceptor for Auto-Refresh**

```typescript
// Request interceptor
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const success = await refreshToken();
        if (success) {
          const newToken = getAccessToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## 🔍 Token Inspection and Debugging

### **JWT Token Decoder**

```typescript
const decodeJWT = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');

    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));

    return {
      header,
      payload,
      signature: parts[2],
      expired: payload.exp * 1000 < Date.now()
    };
  } catch (error) {
    throw new Error('Failed to decode JWT');
  }
};
```

### **Token Debugging Utilities**

```typescript
// Check token expiry
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  return decoded.expired;
};

// Time until expiry
const getTokenTimeToExpiry = (token: string): number => {
  const decoded = decodeJWT(token);
  return Math.max(0, decoded.payload.exp * 1000 - Date.now());
};

// Token information
const getTokenInfo = (token: string) => {
  const decoded = decodeJWT(token);
  return {
    userId: decoded.payload.userId,
    email: decoded.payload.email,
    role: decoded.payload.role,
    issuedAt: new Date(decoded.payload.iat * 1000),
    expiresAt: new Date(decoded.payload.exp * 1000),
    timeToExpiry: getTokenTimeToExpiry(token)
  };
};
```

## 📊 Performance Considerations

### **Token Size Optimization**

```typescript
// Minimal payload for smaller tokens
const createMinimalToken = (user: UserData) => {
  return jwt.sign(
    {
      sub: user.id,        // Standard claim for user ID
      email: user.email,
      role: user.role,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};
```

### **Memory Management**

```typescript
// Clear tokens from memory on logout
const secureLogout = () => {
  // Clear from state
  setAccessToken(null);
  setUser(null);
  
  // Clear from localStorage
  localStorage.removeItem('refreshToken');
  
  // Clear from sessionStorage if used
  sessionStorage.clear();
  
  // Clear from any global variables
  window.authToken = null;
};
```

## 🚀 Advanced Features

### **Multi-Device Session Management**

```typescript
// Get all user sessions
const getUserSessions = async (userId: string) => {
  return await prisma.refreshToken.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() }
    },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      createdAt: true
    }
  });
};

// Revoke specific session
const revokeSession = async (sessionId: string) => {
  await prisma.refreshToken.update({
    where: { id: sessionId },
    data: { isRevoked: true }
  });
};
```

### **Token Blacklisting (Optional)**

```typescript
// For additional security, maintain a blacklist of revoked tokens
const blacklistToken = async (token: string) => {
  const decoded = decodeJWT(token);
  
  await prisma.blacklistedToken.create({
    data: {
      token: token,
      expiresAt: new Date(decoded.payload.exp * 1000)
    }
  });
};

// Check if token is blacklisted
const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const blacklisted = await prisma.blacklistedToken.findUnique({
    where: { token }
  });
  
  return !!blacklisted;
};
```

## 🎯 Best Practices Summary

### **Token Storage**
- ✅ Access tokens: Memory or secure HTTP-only cookies
- ✅ Refresh tokens: localStorage or secure HTTP-only cookies
- ❌ Never store tokens in regular cookies without security flags
- ❌ Never store sensitive tokens in URL parameters

### **Token Validation**
- ✅ Always validate token signature
- ✅ Check token expiration
- ✅ Verify token type (access vs refresh)
- ✅ Implement proper error handling

### **Security Measures**
- ✅ Use HTTPS in production
- ✅ Implement token rotation
- ✅ Set appropriate expiration times
- ✅ Monitor for suspicious activity
- ✅ Implement rate limiting

## 📚 Next Steps

Now that you understand JWT and refresh token implementation:

1. **[Password Management](password-management.md)** - Secure password handling
2. **[User Registration](user-registration.md)** - Complete user lifecycle
3. **[Security Best Practices](../security/cors.md)** - CORS and security headers
4. **[API Testing](../testing/api-testing.md)** - Test your implementation

## 💡 Key Takeaways

This JWT + Refresh Token system provides:
- **Security**: Short-lived access tokens with secure refresh mechanism
- **Scalability**: Stateless authentication that scales horizontally
- **User Experience**: Seamless token refresh without user interaction
- **Auditability**: Complete token lifecycle tracking
- **Flexibility**: Support for multi-device and session management

Ready to implement secure token management? You now have all the tools and knowledge needed! 🚀
