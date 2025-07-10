# 🔐 Authentication API

All authentication endpoints for user registration, login, logout, and token management.

## 📚 Endpoints Overview

| Method | Endpoint                                   | Purpose                   | Auth Required |
| ------ | ------------------------------------------ | ------------------------- | ------------- |
| POST   | `/api/auth/register`                       | Create new user           | ❌            |
| POST   | `/api/auth/login`                          | User login                | ❌            |
| POST   | `/api/auth/logout`                         | User logout               | ✅            |
| POST   | `/api/auth/refresh-token`                  | Refresh access token      | ❌            |
| POST   | `/api/auth/forgot-password`                | Request password reset    | ❌            |
| POST   | `/api/auth/reset-password`                 | Reset password with token | ❌            |
| POST   | `/api/auth/change-password`                | Change password           | ✅            |
| GET    | `/api/auth/reset-password/validate/:token` | Validate reset token      | ❌            |

---

## 1. Register User

Create a new user account.

### Request

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "phone": "+1234567890"  // optional
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "cm123456789",
    "email": "user@example.com",
    "username": "John Doe",
    "phone": "+1234567890",
    "avatar": null,
    "role": "USER",
    "createdAt": "2025-07-10T10:30:00Z",
    "updatedAt": "2025-07-10T10:30:00Z"
  },
  "message": "User registered successfully"
}
```

### Errors

- `400` - Missing required fields
- `409` - Email already exists

---

## 2. Login User

Authenticate user and get tokens.

### Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6...",
    "expiresIn": "15m",
    "user": {
      "id": "cm123456789",
      "email": "user@example.com",
      "username": "John Doe",
      "role": "USER"
    }
  },
  "message": "Login successful"
}
```

### Token Details

- **Access Token**: Use for API requests (expires in 15 minutes)
- **Refresh Token**: Use to get new access tokens (expires in 7 days)

### Errors

- `400` - Missing email or password
- `401` - Invalid credentials

---

## 3. Logout User

Revoke all user tokens.

### Request

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

### Response

```json
{
  "success": true,
  "message": "Logout successful"
}
```

### What happens

- All refresh tokens are revoked
- User must login again

---

## 4. Refresh Token

Get new access token using refresh token.

### Request

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

### Response

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "x1y2z3a4b5c6...",
    "expiresIn": "15m",
    "user": {
      "id": "cm123456789",
      "email": "user@example.com",
      "username": "John Doe",
      "role": "USER"
    }
  },
  "message": "Token refreshed successfully"
}
```

### Important Notes

- Old refresh token is invalidated (token rotation)
- Use the new refresh token for future requests

### Errors

- `400` - Missing refresh token
- `401` - Invalid or expired refresh token

---

## 5. Forgot Password

Request password reset email.

### Request

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Response

```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

### What happens

- Reset email sent if user exists
- Security: Always returns success (doesn't reveal if email exists)

---

## 6. Reset Password

Reset password using email token.

### Request

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm123456789",
      "email": "user@example.com",
      "username": "John Doe"
    }
  },
  "message": "Password has been reset successfully"
}
```

### Errors

- `400` - Missing token or password
- `400` - Password too weak
- `400` - Invalid or expired token

---

## 7. Change Password

Change password for authenticated user.

### Request

```http
POST /api/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### Response

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Errors

- `400` - Missing passwords
- `400` - Current password incorrect
- `400` - New password same as current
- `400` - Password too weak

---

## 8. Validate Reset Token

Check if reset token is valid (useful for frontend).

### Request

```http
GET /api/auth/reset-password/validate/reset_token_here
```

### Response

```json
{
  "success": true,
  "data": {
    "valid": true,
    "expiresAt": "2025-07-10T11:30:00Z",
    "user": {
      "email": "user@example.com"
    }
  },
  "message": "Reset token is valid"
}
```

### If Invalid

```json
{
  "success": false,
  "data": {
    "valid": false
  },
  "error": "Invalid reset token"
}
```

---

## 🔧 Frontend Integration

### React Example

```javascript
// Login function
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.success) {
    // Store tokens
    localStorage.setItem('refreshToken', data.data.refreshToken);
    // Store access token in memory/state (not localStorage)
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
  }

  return data;
};

// Auto-refresh token
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('/api/auth/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();

  if (data.success) {
    setAccessToken(data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return true;
  }

  // Refresh failed, logout
  logout();
  return false;
};

// API call with auto-refresh
const apiCall = async (url, options = {}) => {
  const makeRequest = token =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

  let response = await makeRequest(accessToken);

  // If token expired, try refresh
  if (response.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      response = await makeRequest(accessToken);
    }
  }

  return response;
};
```

## 🛡️ Security Features

### Password Requirements

- Minimum 6 characters (8+ recommended)
- Mix of letters, numbers, symbols

### Token Security

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Token rotation on refresh
- All tokens revoked on logout

### Rate Limiting

- Login attempts: Limited per IP
- Password reset: Limited per email
- Token refresh: Limited per token

## 💡 Tips

1. **Store refresh tokens securely** (localStorage is okay for web apps)
2. **Never store access tokens permanently** (memory/state only)
3. **Handle token expiry gracefully** with auto-refresh
4. **Always use HTTPS in production**
5. **Implement proper error handling**

## 🚨 Common Errors

| Status | Error               | Solution                     |
| ------ | ------------------- | ---------------------------- |
| 401    | Invalid credentials | Check email/password         |
| 401    | Token expired       | Refresh token or login again |
| 429    | Too many requests   | Wait and try again           |
| 409    | Email exists        | Use different email or login |

Need help with user management? Check `../users/user-api.md` 👥
