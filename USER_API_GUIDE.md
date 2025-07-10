# User API Guide

This guide provides detailed information about all user-related API endpoints in the Hono server application.

## Base URLs

- **Authentication:** `http://localhost:3000/api/auth`
- **User Management:** `http://localhost:3000/api/users`
- **Uploads:** `http://localhost:3000/api/uploads`

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### 1. Register User

**Endpoint:** `POST /api/auth/register`  
**Authentication:** Not required  
**Description:** Create a new user account

#### Request Body

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123",
  "phone": "+1234567890" // optional
}
```

#### Response Success (201)

```json
{
  "success": true,
  "data": {
    "id": "clxxxx...",
    "email": "user@example.com",
    "username": "John Doe",
    "phone": "+1234567890",
    "avatar": null,
    "role": "USER",
    "createdAt": "2025-07-10T15:25:18.000Z",
    "updatedAt": "2025-07-10T15:25:18.000Z"
  },
  "message": "User registered successfully"
}
```

#### Response Error (400/409)

```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login`  
**Authentication:** Not required  
**Description:** Authenticate user and get JWT token

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxxx...",
      "email": "user@example.com",
      "username": "John Doe",
      "role": "USER"
    }
  },
  "message": "Login successful"
}
```

#### Response Error (401)

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

### 3. Logout

**Endpoint:** `POST /api/auth/logout`  
**Authentication:** Required  
**Description:** Invalidate the current JWT token

#### Request Body

```json
{}
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 4. Refresh Token

**Endpoint:** `POST /api/auth/refresh-token`  
**Authentication:** Required  
**Description:** Get a new JWT token using the current valid token

#### Request Body

```json
{}
```

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxxx...",
      "email": "user@example.com",
      "username": "John Doe",
      "role": "USER"
    }
  },
  "message": "Token refreshed successfully"
}
```

---

### 5. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`  
**Authentication:** Not required  
**Description:** Send password reset email with secure token

#### Request Body

```json
{
  "email": "user@example.com"
}
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

**Note:** Always returns success for security (doesn't reveal if email exists)

---

### 6. Reset Password

**Endpoint:** `POST /api/auth/reset-password`  
**Authentication:** Not required  
**Description:** Reset password using secure reset token

#### Request Body

```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "newSecurePassword123"
}
```

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxxx...",
      "email": "user@example.com",
      "username": "John Doe"
    }
  },
  "message": "Password has been reset successfully"
}
```

#### Response Error (400)

```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

---

### 7. Validate Reset Token

**Endpoint:** `GET /api/auth/reset-password/validate/:token`  
**Authentication:** Not required  
**Description:** Check if a reset token is valid (useful for frontend validation)

#### URL Parameters

- `token` (string): The reset token to validate

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "valid": true,
    "expiresAt": "2025-07-10T16:40:22.000Z",
    "user": {
      "email": "user@example.com"
    }
  },
  "message": "Reset token is valid"
}
```

#### Response Error (400)

```json
{
  "success": false,
  "data": {
    "valid": false
  },
  "error": "Reset token has expired"
}
```

---

### 8. Change Password

**Endpoint:** `POST /api/auth/change-password`  
**Authentication:** Required  
**Description:** Change password for authenticated users who know their current password

#### Request Body

```json
{
  "currentPassword": "currentPassword123",
  "newPassword": "newPassword456"
}
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Response Error (400)

```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

```json
{
  "success": false,
  "error": "New password must be at least 6 characters long"
}
```

```json
{
  "success": false,
  "error": "New password must be different from current password"
}
```

#### Response Error (401)

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

## 👤 Profile Management

### 4. Get Profile

**Endpoint:** `GET /api/users/profile`  
**Authentication:** Required  
**Description:** Get the current user's profile information

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "id": "clxxxx...",
    "email": "user@example.com",
    "username": "johndoe",
    "phone": "+1234567890",
    "avatar": "/api/avatars/user-avatar.jpg",
    "role": "USER",
    "createdAt": "2025-07-10T15:25:18.000Z",
    "updatedAt": "2025-07-10T15:25:18.000Z"
  }
}
```

---

### 5. Update Profile

**Endpoint:** `PUT /api/users/profile`  
**Authentication:** Required  
**Description:** Update user profile information

#### Request Body

```json
{
  "username": "newusername", // optional
  "phone": "+1987654321" // optional
}
```

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "id": "clxxxx...",
    "email": "user@example.com",
    "username": "newusername",
    "phone": "+1987654321",
    "avatar": "/api/avatars/user-avatar.jpg",
    "role": "USER",
    "createdAt": "2025-07-10T15:25:18.000Z",
    "updatedAt": "2025-07-10T15:30:25.000Z"
  },
  "message": "Profile updated successfully"
}
```

---

## 📍 Address Management

### 6. Get All Addresses

**Endpoint:** `GET /api/users/address`  
**Authentication:** Required  
**Description:** Get all saved addresses for the current user

#### Response Success (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "clxxxx...",
      "name": "Home",
      "street": "123 Main Street",
      "city": "New York",
      "zip": "10001",
      "phone": "+1234567890",
      "createdAt": "2025-07-10T15:25:18.000Z",
      "updatedAt": "2025-07-10T15:25:18.000Z"
    },
    {
      "id": "clxxxx...",
      "name": "Office",
      "street": "456 Business Ave",
      "city": "New York",
      "zip": "10002",
      "phone": "+1987654321",
      "createdAt": "2025-07-10T15:30:18.000Z",
      "updatedAt": "2025-07-10T15:30:18.000Z"
    }
  ]
}
```

---

### 7. Add New Address

**Endpoint:** `POST /api/users/address`  
**Authentication:** Required  
**Description:** Add a new address for the current user

#### Request Body

```json
{
  "name": "Home",
  "street": "123 Main Street",
  "city": "New York",
  "zip": "10001",
  "phone": "+1234567890" // optional
}
```

#### Response Success (201)

```json
{
  "success": true,
  "data": {
    "id": "clxxxx...",
    "name": "Home",
    "street": "123 Main Street",
    "city": "New York",
    "zip": "10001",
    "phone": "+1234567890",
    "createdAt": "2025-07-10T15:25:18.000Z",
    "updatedAt": "2025-07-10T15:25:18.000Z"
  },
  "message": "Address created successfully"
}
```

#### Response Error (400)

```json
{
  "success": false,
  "error": "Missing required fields: name, street, city, zip"
}
```

---

### 8. Delete Address

**Endpoint:** `DELETE /api/users/address/:id`  
**Authentication:** Required  
**Description:** Delete a specific address (only if it belongs to the current user)

#### URL Parameters

- `id` (string): The address ID to delete

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "id": "clxxxx...",
    "name": "Home",
    "street": "123 Main Street",
    "city": "New York",
    "zip": "10001",
    "phone": "+1234567890"
  },
  "message": "Address deleted successfully"
}
```

#### Response Error (404)

```json
{
  "success": false,
  "error": "Failed to delete address",
  "message": "Address not found or unauthorized"
}
```

---

## 👨‍💼 Admin Endpoints

### 9. Get All Users (Admin Only)

**Endpoint:** `GET /api/users/getAll`  
**Authentication:** Required (Admin role)  
**Description:** Get all users in the system (admin access only)

#### Response Success (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "clxxxx...",
      "email": "user1@example.com",
      "username": "user1",
      "phone": "+1234567890",
      "avatar": null,
      "role": "USER",
      "createdAt": "2025-07-10T15:25:18.000Z",
      "updatedAt": "2025-07-10T15:25:18.000Z"
    },
    {
      "id": "clxxxx...",
      "email": "admin@example.com",
      "username": "admin",
      "phone": "+1987654321",
      "avatar": "/api/avatars/admin-avatar.jpg",
      "role": "ADMIN",
      "createdAt": "2025-07-10T14:20:10.000Z",
      "updatedAt": "2025-07-10T14:20:10.000Z"
    }
  ]
}
```

#### Response Error (403)

```json
{
  "success": false,
  "error": "Unauthorized access"
}
```

---

## 📤 Upload Endpoints

### 10. Upload Avatar

**Endpoint:** `POST /api/uploads/avatar`  
**Authentication:** Required  
**Description:** Upload a profile avatar image

#### Request Body

Form data with file upload:

```
Content-Type: multipart/form-data

avatar: [image file]
```

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "id": "clxxxx...",
    "email": "user@example.com",
    "username": "johndoe",
    "phone": "+1234567890",
    "avatar": "/api/avatars/440ce4a4-b87d-4dac-bc99-413ce59825a0.jpg",
    "role": "USER",
    "createdAt": "2025-07-10T15:25:18.000Z",
    "updatedAt": "2025-07-10T15:35:22.000Z"
  },
  "message": "Avatar uploaded successfully"
}
```

---

## 📋 Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description" // optional
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `500` - Internal Server Error

---

## 🔄 Example Usage with JavaScript

### Using Fetch API

```javascript
// Register
const registerResponse = await fetch(
  'http://localhost:3000/api/auth/register',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'user@example.com',
      name: 'John Doe',
      password: 'password123',
    }),
  }
);
const registerData = await registerResponse.json();

// Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
});
const loginData = await loginResponse.json();
const token = loginData.data.token;

// Get Profile
const profileResponse = await fetch('http://localhost:3000/api/users/profile', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
const profileData = await profileResponse.json();

// Add Address
const addressResponse = await fetch('http://localhost:3000/api/users/address', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Home',
    street: '123 Main St',
    city: 'New York',
    zip: '10001',
    phone: '+1234567890',
  }),
});
const addressData = await addressResponse.json();

// Refresh Token
const refreshResponse = await fetch(
  'http://localhost:3000/api/auth/refresh-token',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
);
const refreshData = await refreshResponse.json();
```

### Using Axios

```javascript
import axios from 'axios';

// Create separate instances for auth and user APIs
const authApi = axios.create({
  baseURL: 'http://localhost:3000/api/auth',
  headers: {
    'Content-Type': 'application/json',
  },
});

const userApi = axios.create({
  baseURL: 'http://localhost:3000/api/users',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Register
const register = async (email, name, password) => {
  const response = await authApi.post('/register', { email, name, password });
  return response.data;
};

// Login and set token
const login = async (email, password) => {
  const response = await authApi.post('/login', { email, password });
  const token = response.data.data.token;

  // Set token for future requests
  authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  userApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  return response.data;
};

// Get addresses
const getAddresses = async () => {
  const response = await userApi.get('/address');
  return response.data;
};

// Update profile
const updateProfile = async updates => {
  const response = await userApi.put('/profile', updates);
  return response.data;
};

// Refresh token
const refreshToken = async () => {
  const response = await authApi.post('/refresh-token');
  const newToken = response.data.data.token;

  // Update tokens
  authApi.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  userApi.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

  return response.data;
};
```

---

## 🔗 Related Endpoints

### Static File Access

- **Avatar Images:** `GET /api/avatars/{filename}` - Access uploaded avatar images
- **Post Images:** `GET /api/posts/{postId}/{filename}` - Access post-related images

### Health Check

- **Health:** `GET /health` - Check API health status

---

_Last updated: July 10, 2025_
