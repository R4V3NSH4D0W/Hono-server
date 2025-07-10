# 🔐 Password Change vs Password Reset

## 🤔 **What's the Difference?**

### **Password Reset (✅ IMPLEMENTED)**

- **When**: User **forgot** their password
- **Authentication**: **NOT** required (user can't log in)
- **Process**: Email → Token → New Password
- **Security**: Email verification + secure tokens
- **Endpoints**:
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`

### **Password Change (❌ MISSING)**

- **When**: User **knows** current password and wants to change it
- **Authentication**: **REQUIRED** (user is logged in)
- **Process**: Current Password → New Password
- **Security**: Current password verification + JWT auth
- **Endpoint**: `POST /api/auth/change-password` _(NOT YET IMPLEMENTED)_

---

## 🔄 **Password Change Flow (TO IMPLEMENT)**

### **1. User is Logged In**

```
User has valid JWT token from login
```

### **2. User Wants to Change Password**

```bash
POST /api/auth/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

### **3. System Validates**

- ✅ JWT token is valid
- ✅ User exists and is active
- ✅ Current password is correct
- ✅ New password meets requirements
- ✅ New password is different from current

### **4. System Updates Password**

- Hash new password
- Update in database
- Return success response

---

## 🛡️ **Security Considerations**

### **Why Require Current Password?**

1. **Session Hijacking Protection**: Even if someone steals JWT, they can't change password
2. **Confirmation**: User must know current password to change it
3. **Best Practice**: Industry standard (GitHub, Google, etc.)

### **Additional Security Features**

- **Rate Limiting**: Prevent brute force on current password
- **Password History**: Prevent reusing recent passwords (optional)
- **Session Invalidation**: Force re-login after password change (optional)
- **Audit Logging**: Log all password change attempts

---

## 📋 **Implementation Requirements**

### **New Endpoint: Change Password**

```typescript
// POST /api/auth/change-password
app.post('/api/auth/change-password', authMiddleware, async c => {
  const { currentPassword, newPassword } = await c.req.json();
  const user = c.get('user'); // From JWT middleware

  // 1. Validate current password
  const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentValid) {
    return c.json(
      { success: false, error: 'Current password is incorrect' },
      400
    );
  }

  // 2. Validate new password
  if (newPassword.length < 6) {
    return c.json(
      { success: false, error: 'New password must be at least 6 characters' },
      400
    );
  }

  // 3. Check if new password is different
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    return c.json(
      {
        success: false,
        error: 'New password must be different from current password',
      },
      400
    );
  }

  // 4. Update password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return c.json({
    success: true,
    message: 'Password changed successfully',
  });
});
```

### **Service Function**

```typescript
// src/services/user-service.ts
export const userService = {
  // ...existing functions...

  changePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) => {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Check if new password is different
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      throw new Error('New password must be different from current password');
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return { success: true };
  },
};
```

---

## 🧪 **Testing Scenarios**

### **Happy Path**

```bash
# 1. Login to get JWT
POST /api/auth/login
{ "email": "user@example.com", "password": "oldpass123" }

# 2. Change password
POST /api/auth/change-password
Authorization: Bearer <JWT_TOKEN>
{ "currentPassword": "oldpass123", "newPassword": "newpass456" }

# 3. Login with new password
POST /api/auth/login
{ "email": "user@example.com", "password": "newpass456" }
```

### **Error Cases**

```bash
# Wrong current password
{ "currentPassword": "wrongpass", "newPassword": "newpass456" }
→ 400: "Current password is incorrect"

# Weak new password
{ "currentPassword": "oldpass123", "newPassword": "123" }
→ 400: "New password must be at least 6 characters"

# Same password
{ "currentPassword": "oldpass123", "newPassword": "oldpass123" }
→ 400: "New password must be different from current password"

# No JWT token
→ 401: "Unauthorized"
```

---

## 📝 **Documentation Updates Needed**

### **API Guide Updates**

- Add change password endpoint to `USER_API_GUIDE.md`
- Include request/response examples
- Document security requirements

### **Testing Guide Updates**

- Add change password tests to `POSTMAN_TESTING_GUIDE.md`
- Include Postman collection updates
- Document testing scenarios

---

## 🎯 **When to Use Each**

| Scenario                                  | Use             | Endpoint                                                 |
| ----------------------------------------- | --------------- | -------------------------------------------------------- |
| **User forgot password**                  | Password Reset  | `/api/auth/forgot-password` + `/api/auth/reset-password` |
| **User knows password & wants to change** | Password Change | `/api/auth/change-password`                              |
| **Security breach**                       | Both            | Force reset + require change                             |
| **First login**                           | Password Change | After initial login                                      |

---

## 🚀 **Next Steps**

1. **Implement** `POST /api/auth/change-password` endpoint
2. **Add** service function to `user-service.ts`
3. **Update** API documentation
4. **Add** Postman tests
5. **Test** all scenarios

---

**This completes the full password management system! 🎉**
