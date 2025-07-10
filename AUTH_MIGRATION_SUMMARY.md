# Authentication API Restructure - Summary

## 🔄 **Changes Made**

### **1. New Authentication Structure**

Moved authentication endpoints from `/api/users` to `/api/auth` for better organization:

| Old Endpoint             | New Endpoint                     | Status               |
| ------------------------ | -------------------------------- | -------------------- |
| `POST /api/users`        | `POST /api/auth/register`        | ✅ Moved             |
| `POST /api/users/login`  | `POST /api/auth/login`           | ✅ Moved             |
| `POST /api/users/logout` | `POST /api/auth/logout`          | ✅ Moved             |
| —                        | `POST /api/auth/refresh-token`   | ✅ New               |
| —                        | `POST /api/auth/forgot-password` | ✅ New (placeholder) |
| —                        | `POST /api/auth/reset-password`  | ✅ New (placeholder) |

### **2. File Structure Changes**

- **Created:** `src/routes/auth.ts` - New authentication routes file
- **Updated:** `src/routes/users.ts` - Removed auth endpoints, kept profile and address management
- **Updated:** `src/server.ts` - Added auth routes and updated endpoint documentation

### **3. Enhanced Authentication Features**

#### **Register Endpoint** (`POST /api/auth/register`)

- Uses `name` field instead of `username` in request body
- Maps internally to `username` for database consistency
- Improved validation and error handling

#### **Refresh Token Endpoint** (`POST /api/auth/refresh-token`)

- Allows users to get a new JWT token without re-logging in
- Uses existing token to verify identity
- Returns new token with same user permissions

#### **Password Reset Placeholders**

- `POST /api/auth/forgot-password` - Email validation ready
- `POST /api/auth/reset-password` - Token structure ready
- Returns appropriate status codes (501 for not implemented)

### **4. Updated API Documentation**

- **Updated:** `USER_API_GUIDE.md` with new auth structure
- Separated auth and user management sections
- Added examples for all new endpoints
- Updated JavaScript/Axios usage examples

### **5. Server Configuration**

Updated main server endpoints documentation:

```json
{
  "auth": {
    "register": "/api/auth/register",
    "login": "/api/auth/login",
    "logout": "/api/auth/logout",
    "refreshToken": "/api/auth/refresh-token",
    "forgotPassword": "/api/auth/forgot-password",
    "resetPassword": "/api/auth/reset-password"
  },
  "users": {
    "profile": {
      "get": "/api/users/profile",
      "update": "/api/users/profile"
    },
    "addresses": {
      "list": "/api/users/address",
      "create": "/api/users/address",
      "delete": "/api/users/address/:id"
    }
  }
}
```

## 📋 **What Remains the Same**

### **User Management Endpoints** (Still at `/api/users`)

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/address` - Get user addresses
- `POST /api/users/address` - Create address
- `DELETE /api/users/address/:id` - Delete address
- `GET /api/users/getAll` - Admin: Get all users

### **Upload Endpoints** (Still at `/api/uploads`)

- `POST /api/uploads/avatar` - Upload avatar

### **Authentication Requirements**

- JWT token structure unchanged
- Authorization header format unchanged
- Middleware behavior unchanged

## 🚀 **Benefits of New Structure**

1. **Better Organization**: Clear separation between auth and user management
2. **Scalability**: Easy to add more auth features (2FA, OAuth, etc.)
3. **Security**: Dedicated auth namespace reduces confusion
4. **Standards Compliance**: Follows REST API best practices
5. **Maintainability**: Separate files for different concerns

## 🔧 **For Frontend Developers**

### **Migration Steps**

1. Update registration calls from `POST /api/users` to `POST /api/auth/register`
2. Update login calls from `POST /api/users/login` to `POST /api/auth/login`
3. Update logout calls from `POST /api/users/logout` to `POST /api/auth/logout`
4. Change request body for registration: `username` → `name`

### **New Features Available**

- **Token Refresh**: Call `POST /api/auth/refresh-token` to get new token
- **Password Reset**: Framework ready for `forgot-password` and `reset-password`

### **Example Migration**

```javascript
// OLD
const response = await fetch('/api/users/login', { ... });

// NEW
const response = await fetch('/api/auth/login', { ... });
```

## ⚠️ **Important Notes**

1. **Breaking Changes**: Old auth endpoints no longer exist
2. **Database**: No changes to database schema or user data
3. **Token Format**: JWT tokens remain compatible
4. **Password Reset**: Placeholder implementation only - needs email service integration

---

_Migration completed: July 10, 2025_
