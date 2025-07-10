# 🧪 Password Reset Testing with Postman

## 🚀 **Setup Instructions**

### **1. Start the Server**

```bash
cd /Volumes/Extended/backend/hono-server
npm run dev
```

### **2. Base URL**

```
http://localhost:3000
```

---

## 📋 **Postman Collection - Password Reset Flow**

### **Step 1: Register a Test User**

**Request:**

```
POST http://localhost:3000/api/auth/register
```

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "email": "testuser@example.com",
  "name": "Test User",
  "password": "oldpassword123",
  "phone": "+1234567890"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "email": "testuser@example.com",
    "username": "Test User",
    "phone": "+1234567890",
    "avatar": null,
    "role": "USER",
    "createdAt": "2025-07-10T15:25:18.000Z",
    "updatedAt": "2025-07-10T15:25:18.000Z"
  },
  "message": "User registered successfully"
}
```

---

### **Step 2: Test Login with Original Password**

**Request:**

```
POST http://localhost:3000/api/auth/login
```

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "email": "testuser@example.com",
  "password": "oldpassword123"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxx...",
      "email": "testuser@example.com",
      "username": "Test User",
      "role": "USER"
    }
  },
  "message": "Login successful"
}
```

---

### **Step 3: Request Password Reset**

**Request:**

```
POST http://localhost:3000/api/auth/forgot-password
```

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "email": "testuser@example.com"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

**Check Console Output:**
Look for something like this in your server console:

```
=== EMAIL SENT (DEVELOPMENT MODE) ===
To: testuser@example.com
Subject: Password Reset Request
Reset URL: http://localhost:3000/reset-password?token=a1b2c3d4e5f6789abc123def456...
=====================================
Password reset token generated for testuser@example.com: a1b2c3d4e5f6789abc123def456...
```

**⚠️ COPY THE TOKEN from the console output for the next steps!**

---

### **Step 4: Validate Reset Token (Optional)**

**Request:**

```
GET http://localhost:3000/api/auth/reset-password/validate/YOUR_TOKEN_HERE
```

Replace `YOUR_TOKEN_HERE` with the token from Step 3.

**Headers:**

```
Content-Type: application/json
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "expiresAt": "2025-07-10T16:40:22.000Z",
    "user": {
      "email": "testuser@example.com"
    }
  },
  "message": "Reset token is valid"
}
```

---

### **Step 5: Reset Password**

**Request:**

```
POST http://localhost:3000/api/auth/reset-password
```

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "token": "YOUR_TOKEN_HERE",
  "newPassword": "newpassword123"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxxx...",
      "email": "testuser@example.com",
      "username": "Test User"
    }
  },
  "message": "Password has been reset successfully"
}
```

---

### **Step 6: Test Login with New Password**

**Request:**

```
POST http://localhost:3000/api/auth/login
```

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "email": "testuser@example.com",
  "password": "newpassword123"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxx...",
      "email": "testuser@example.com",
      "username": "Test User",
      "role": "USER"
    }
  },
  "message": "Login successful"
}
```

---

### **Step 7: Verify Old Password Doesn't Work**

**Request:**

```
POST http://localhost:3000/api/auth/login
```

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "email": "testuser@example.com",
  "password": "oldpassword123"
}
```

**Expected Response (401):**

```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

## 🔄 **Change Password Testing (For Authenticated Users)**

### **Step 8: Change Password (Happy Path)**

**Request:**

```
POST http://localhost:3000/api/auth/change-password
```

**Headers:**

```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body (JSON):**

```json
{
  "currentPassword": "newpassword123",
  "newPassword": "changedpassword456"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### **Step 9: Test Login with Changed Password**

**Request:**

```
POST http://localhost:3000/api/auth/login
```

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "email": "testuser@example.com",
  "password": "changedpassword456"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "clxxx...",
      "email": "testuser@example.com",
      "username": "Test User",
      "role": "USER"
    }
  },
  "message": "Login successful"
}
```

---

## 🧪 **Change Password Error Testing**

### **Test 1: Wrong Current Password**

**Request:**

```
POST http://localhost:3000/api/auth/change-password
```

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body:**

```json
{
  "currentPassword": "wrongpassword",
  "newPassword": "newpassword123"
}
```

**Expected Response (400):**

```json
{
  "success": false,
  "error": "Current password is incorrect"
}
```

---

### **Test 2: Weak New Password**

**Request:**

```
POST http://localhost:3000/api/auth/change-password
```

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body:**

```json
{
  "currentPassword": "changedpassword456",
  "newPassword": "123"
}
```

**Expected Response (400):**

```json
{
  "success": false,
  "error": "New password must be at least 6 characters long"
}
```

---

### **Test 3: Same Password**

**Request:**

```
POST http://localhost:3000/api/auth/change-password
```

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**Body:**

```json
{
  "currentPassword": "changedpassword456",
  "newPassword": "changedpassword456"
}
```

**Expected Response (400):**

```json
{
  "success": false,
  "error": "New password must be different from current password"
}
```

---

### **Test 4: No Authorization**

**Request:**

```
POST http://localhost:3000/api/auth/change-password
```

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "currentPassword": "changedpassword456",
  "newPassword": "anothernewpassword"
}
```

**Expected Response (401):**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

---

## 🎯 **Testing Checklist**

### **Password Reset Flow**

- [ ] ✅ User registration works
- [ ] ✅ Original password login works
- [ ] ✅ Password reset request generates token
- [ ] ✅ Reset token validation works
- [ ] ✅ Password reset with valid token works
- [ ] ✅ New password login works
- [ ] ✅ Old password login fails
- [ ] ✅ Invalid token is rejected
- [ ] ✅ Weak password is rejected
- [ ] ✅ Non-existent email returns secure response

### **Password Change Flow**

- [ ] ✅ Change password with valid current password works
- [ ] ✅ Login with changed password works
- [ ] ✅ Wrong current password is rejected
- [ ] ✅ Weak new password is rejected
- [ ] ✅ Same password is rejected
- [ ] ✅ Unauthorized access is rejected

---

## 🔍 **What to Watch For**

1. **Console Output**: Reset tokens will be logged in development mode
2. **Response Times**: Should be fast (< 500ms for most operations)
3. **Error Messages**: Should be user-friendly but not reveal system details
4. **Security**: Email enumeration protection (same response for valid/invalid emails)

Start with Step 1 and work through each step! Let me know if you encounter any issues. 🚀
