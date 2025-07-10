# Alternative: OTP-Based Password Reset Implementation

## 🔢 **OTP-Style Password Reset Flow**

### **How it Works:**

1. User requests password reset
2. System generates 6-digit code (e.g., `123456`)
3. Code sent via email/SMS
4. User enters code on reset form
5. System validates code and allows password change

### **Implementation Example:**

```typescript
// OTP-based password reset service
export const passwordResetOTPService = {
  /**
   * Generate and store a 6-digit OTP for password reset
   */
  generateResetOTP: async (userId: string): Promise<string> => {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 10 minutes (shorter than token)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate existing unused OTPs
    await prisma.passwordResetToken.updateMany({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });

    // Store new OTP
    await prisma.passwordResetToken.create({
      data: {
        token: otp, // 6-digit code instead of 64-char token
        userId,
        expiresAt,
      },
    });

    return otp;
  },

  /**
   * Validate OTP code
   */
  validateResetOTP: async (otp: string, email: string) => {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        passwordResetTokens: {
          where: {
            token: otp,
            used: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user || user.passwordResetTokens.length === 0) {
      throw new Error('Invalid or expired OTP code');
    }

    return user.passwordResetTokens[0];
  },

  /**
   * Reset password with OTP verification
   */
  resetPasswordWithOTP: async (
    email: string,
    otp: string,
    newPassword: string
  ) => {
    // Validate OTP
    const resetToken = await passwordResetOTPService.validateResetOTP(
      otp,
      email
    );

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark OTP as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return { success: true };
  },
};
```

### **API Endpoints for OTP Flow:**

```typescript
// 1. Request OTP
app.post('/api/auth/forgot-password-otp', async c => {
  const { email } = await c.req.json();
  const user = await userService.findByEmail(email);

  if (user) {
    const otp = await passwordResetOTPService.generateResetOTP(user.id);
    await emailService.sendPasswordResetOTP(email, user.username, otp);
  }

  return c.json({
    success: true,
    message: 'If email exists, OTP has been sent',
  });
});

// 2. Verify OTP and reset password
app.post('/api/auth/reset-password-otp', async c => {
  const { email, otp, newPassword } = await c.req.json();

  try {
    await passwordResetOTPService.resetPasswordWithOTP(email, otp, newPassword);
    return c.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Invalid OTP or email',
      },
      400
    );
  }
});
```

### **Email Template for OTP:**

```html
<h2>Password Reset Code</h2>
<p>Hello {{username}},</p>
<p>Your password reset code is:</p>
<div
  style="font-size: 32px; font-weight: bold; text-align: center; 
            background: #f0f0f0; padding: 20px; margin: 20px 0;"
>
  {{otp_code}}
</div>
<p><strong>This code expires in 10 minutes.</strong></p>
<p>Enter this code on the password reset page to continue.</p>
```

## 🔄 **Token vs OTP Comparison**

| Aspect              | **Long Token (Current)** | **6-Digit OTP**      |
| ------------------- | ------------------------ | -------------------- |
| **User Experience** | Click email link         | Type code manually   |
| **Security**        | Extremely secure         | Secure but guessable |
| **Implementation**  | Simple (one-step)        | Two-step process     |
| **Email Length**    | Long URL                 | Short, clean         |
| **Expiration**      | 1 hour                   | 10 minutes           |
| **Brute Force**     | Impossible               | 1 in 1,000,000       |

## 🎯 **Which Should We Use?**

### **Use Long Token When:**

- ✅ You want one-click password reset
- ✅ Maximum security is priority
- ✅ Users primarily use email
- ✅ Simple implementation preferred

### **Use OTP When:**

- ✅ Users expect to type codes
- ✅ You want shorter emails
- ✅ Two-factor authentication feel
- ✅ SMS delivery is possible

## 💭 **Recommendation**

**Current implementation (long token) is actually better because:**

1. **Better UX**: One click vs typing codes
2. **More secure**: Impossible to brute force
3. **Industry standard**: Gmail, Facebook, GitHub all use long tokens
4. **No typing errors**: Users can't mistype the token

But if you prefer the OTP approach, I can quickly implement it! What do you think?
