# 🚀 Hono Backend API Documentation

Simple, clean documentation for developers. Each module has its own folder with clear examples.

## 📁 Documentation Structure

```
docs/
├── api-overview.md    # This file - main overview
├── auth/              # Authentication endpoints
│   └── auth-api.md    # Login, register, logout, tokens
├── users/             # User management
│   └── user-api.md    # Profile, settings, admin
└── upload/            # File uploads
    └── upload-api.md  # Avatar, file management
```

## 🎯 Quick Start

1. **Authentication**: Start with `auth/auth-api.md`
2. **User Management**: Check `users/user-api.md`
3. **File Uploads**: See `upload/upload-api.md`

## 🔧 Base URL

```
Development: http://localhost:3000
Production:  https://your-domain.com
```

## 📝 Common Headers

All authenticated requests need:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 📊 Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## 🚦 HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Server Error

## 🔑 Authentication Flow

1. **Register** or **Login** to get tokens
2. Use **access token** for API requests
3. Use **refresh token** when access token expires
4. **Logout** to revoke all tokens

## 📖 Module Overview

| Module     | Purpose               | Key Features                        |
| ---------- | --------------------- | ----------------------------------- |
| **Auth**   | Authentication system | JWT tokens, password reset, refresh |
| **Users**  | User management       | Profile, settings, admin functions  |
| **Upload** | File handling         | Avatar upload, file management      |

Ready to start? Pick a module and dive in! 🏊‍♂️
