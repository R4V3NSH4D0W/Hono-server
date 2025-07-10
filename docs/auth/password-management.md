# 🔒 Password Management System

This comprehensive guide covers our secure password management system, including password changes, resets, validation, and security best practices. Learn how we protect user credentials while providing a smooth user experience.

## 🎯 What You'll Master

By the end of this guide, you'll understand:
- Secure password hashing and storage
- Password change vs password reset flows
- Token-based password reset system
- Password strength validation
- Security considerations and best practices

## 📖 The Password Security Story

### **The Challenge of Password Management**

Passwords are often the weakest link in security systems. Our approach addresses common problems:

❌ **Common Issues**:
- Plain text storage
- Weak password policies
- Insecure reset mechanisms
- Poor user experience

✅ **Our Solutions**:
- Bcrypt hashing with salt
- Comprehensive validation
- Secure token-based resets
- User-friendly flows

## 🏗️ Password System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Action   │    │   Server        │    │   Database      │
│                 │    │   Processing    │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │ Password Change        │                        │
         │───────────────────────►│ Verify Current Pass   │
         │                        │───────────────────────►│
         │                        │ Hash New Password     │
         │                        │───────────────────────►│
         │                        │                        │
         │ Password Reset Request │                        │
         │───────────────────────►│ Generate Reset Token  │
         │                        │───────────────────────►│
         │                        │ Send Email            │
         │                        │──────────────────────►│
         │                        │                        │
         │ Complete Reset         │ Validate Token        │
         │───────────────────────►│───────────────────────►│
         │                        │ Update Password       │
         │                        │───────────────────────►│
```

## 🔐 Password Hashing Implementation

### **Secure Hashing with Bcrypt**

```typescript
import bcrypt from 'bcrypt';

// Password hashing during registration/change
const hashPassword = async (plainPassword: string): Promise<string> => {
  const saltRounds = 12; // Recommended for 2025
  return await bcrypt.hash(plainPassword, saltRounds);
};

// Password verification during login
const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
```

**Why Bcrypt?**
- **Adaptive**: Cost factor increases over time
- **Salt Included**: Each hash is unique
- **Industry Standard**: Widely tested and trusted
- **Slow by Design**: Resistant to brute force attacks

### **Password Strength Validation**

```typescript
interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  let score = 0;

  // Length requirements
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Character variety
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Common password check
  const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
    score = 0;
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong';
  if (score < 3) strength = 'weak';
  else if (score < 5) strength = 'medium';
  else strength = 'strong';

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
};
```

## 🔄 Password Change Flow

### **For Authenticated Users**

This flow is for users who know their current password and want to change it.

```typescript
// POST /api/auth/change-password
const changePassword = async (currentPassword: string, newPassword: string, userId: string) => {
  // 1. Validate new password
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
  }

  // 2. Get current user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // 3. Verify current password
  const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentValid) {
    throw new Error('Current password is incorrect');
  }

  // 4. Check if new password is different
  const isSame = await bcrypt.compare(newPassword, user.password);
  if (isSame) {
    throw new Error('New password must be different from current password');
  }

  // 5. Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // 6. Update in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date()
    }
  });

  // 7. Optional: Revoke all refresh tokens for security
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true }
  });

  return { success: true, message: 'Password changed successfully' };
};
```

## 🔑 Password Reset Flow

### **For Users Who Forgot Their Password**

This secure flow allows users to reset their password via email verification.

```typescript
// Step 1: Request Password Reset
// POST /api/auth/forgot-password
const requestPasswordReset = async (email: string) => {
  // 1. Check if user exists (don't reveal if email exists)
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Return success anyway for security (don't reveal user existence)
    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  // 2. Generate secure reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // 3. Store reset token in database
  await prisma.passwordResetToken.create({
    data: {
      token: resetToken,
      userId: user.id,
      expiresAt,
      used: false
    }
  });

  // 4. Send reset email
  await sendPasswordResetEmail(user.email, user.username, resetToken);

  return { success: true, message: 'If the email exists, a reset link has been sent' };
};

// Step 2: Validate Reset Token
// GET /api/auth/reset-password/validate/:token
const validateResetToken = async (token: string) => {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!resetToken) {
    throw new Error('Invalid reset token');
  }

  if (resetToken.used) {
    throw new Error('Reset token has already been used');
  }

  if (resetToken.expiresAt < new Date()) {
    throw new Error('Reset token has expired');
  }

  return {
    valid: true,
    expiresAt: resetToken.expiresAt,
    user: {
      email: resetToken.user.email
    }
  };
};

// Step 3: Complete Password Reset
// POST /api/auth/reset-password
const resetPassword = async (token: string, newPassword: string) => {
  // 1. Validate reset token
  const resetToken = await validateResetToken(token);

  // 2. Validate new password
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
  }

  // 3. Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // 4. Update user password
  const updatedUser = await prisma.user.update({
    where: { id: resetToken.userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date()
    },
    select: {
      id: true,
      email: true,
      username: true
    }
  });

  // 5. Mark reset token as used
  await prisma.passwordResetToken.update({
    where: { token },
    data: { used: true }
  });

  // 6. Revoke all refresh tokens for security
  await prisma.refreshToken.updateMany({
    where: { userId: resetToken.userId },
    data: { isRevoked: true }
  });

  return {
    success: true,
    user: updatedUser,
    message: 'Password has been reset successfully'
  };
};
```

## 📧 Email Reset System

### **Password Reset Email Template**

```typescript
const sendPasswordResetEmail = async (email: string, username: string, resetToken: string) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const emailHtml = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
        <h1 style="color: #333;">Password Reset Request</h1>
      </div>
      
      <div style="padding: 30px;">
        <p>Hello ${username},</p>
        
        <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        
        <p style="margin-top: 30px; font-size: 14px; color: #666;">
          This link will expire in 1 hour for security reasons.
        </p>
        
        <p style="font-size: 14px; color: #666;">
          If you continue to have problems, please contact our support team.
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  `;

  // Send email using your email service
  await emailService.send({
    to: email,
    subject: 'Password Reset Request',
    html: emailHtml
  });
};
```

### **Email Service Implementation**

```typescript
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async send(options: {
    to: string;
    subject: string;
    html: string;
  }) {
    try {
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html
      });
      
      console.log(`Email sent to: ${options.to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }
}
```

## 🛡️ Security Considerations

### **Password Storage Security**

```sql
-- Database security measures
-- Ensure password column is properly typed and sized
ALTER TABLE users ADD CONSTRAINT password_length CHECK (length(password) >= 60);

-- Index for performance but not on password column
CREATE INDEX idx_users_email ON users(email);
-- Never index password columns!
```

### **Rate Limiting for Password Operations**

```typescript
// Special rate limiting for password operations
const passwordRateLimit = rateLimitMiddleware(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

// Apply to password-related endpoints
authRoutes.post('/change-password', passwordRateLimit, changePasswordHandler);
authRoutes.post('/forgot-password', passwordRateLimit, forgotPasswordHandler);
authRoutes.post('/reset-password', passwordRateLimit, resetPasswordHandler);
```

### **Token Security Measures**

```typescript
// Secure token generation
const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Token cleanup (remove expired tokens)
const cleanupExpiredTokens = async () => {
  await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true }
      ]
    }
  });
};

// Run cleanup periodically
setInterval(cleanupExpiredTokens, 24 * 60 * 60 * 1000); // Daily cleanup
```

## 🎯 Frontend Integration

### **Password Change Form**

```tsx
const PasswordChangeForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!currentPassword) {
      newErrors.push('Current password is required');
    }

    if (newPassword !== confirmPassword) {
      newErrors.push('New passwords do not match');
    }

    // Client-side password validation
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      newErrors.push(...validation.errors);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        // Success feedback
        toast.success('Password changed successfully');
        
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrors([data.error]);
      }
    } catch (error) {
      setErrors(['Failed to change password']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <div className="error-messages">
          {errors.map((error, index) => (
            <p key={index} className="error">{error}</p>
          ))}
        </div>
      )}

      <div className="form-group">
        <label>Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <PasswordStrengthIndicator password={newPassword} />
      </div>

      <div className="form-group">
        <label>Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
};
```

### **Password Reset Flow**

```tsx
// Step 1: Request Reset
const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error('Reset request failed:', error);
    }
  };

  if (submitted) {
    return (
      <div className="success-message">
        <h2>Check Your Email</h2>
        <p>If an account with that email exists, we've sent you a password reset link.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit">Send Reset Link</button>
    </form>
  );
};

// Step 2: Complete Reset
const ResetPasswordForm: React.FC<{ token: string }> = ({ token }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to login with success message
        router.push('/login?reset=success');
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Reset Your Password</h2>
      
      <div className="form-group">
        <label>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <PasswordStrengthIndicator password={newPassword} />
      </div>

      <div className="form-group">
        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
};
```

## 📊 Password Security Metrics

### **Monitoring Password Security**

```typescript
// Track password-related metrics
const trackPasswordMetrics = {
  changeAttempts: 0,
  changeSuccesses: 0,
  resetRequests: 0,
  resetCompletions: 0,
  weakPasswords: 0
};

// Log security events
const logSecurityEvent = async (event: string, userId: string, details: any) => {
  await prisma.securityLog.create({
    data: {
      event,
      userId,
      details,
      timestamp: new Date(),
      ipAddress: details.ipAddress,
      userAgent: details.userAgent
    }
  });
};
```

## 🎯 Best Practices Summary

### **Password Storage**
- ✅ Use bcrypt with salt rounds ≥ 12
- ✅ Never store passwords in plain text
- ✅ Never log password values
- ❌ Never index password columns

### **Password Policies**
- ✅ Minimum 8 characters (12+ recommended)
- ✅ Require character variety
- ✅ Check against common passwords
- ✅ Validate on both client and server

### **Reset Security**
- ✅ Use secure random tokens
- ✅ Set short expiration times (1 hour)
- ✅ One-time use tokens
- ✅ Rate limit reset requests
- ✅ Don't reveal user existence

### **User Experience**
- ✅ Clear password requirements
- ✅ Real-time strength feedback
- ✅ Helpful error messages
- ✅ Secure email templates

## 📚 Next Steps

Now that you understand password management:

1. **[User Registration](user-registration.md)** - Complete user lifecycle
2. **[API Endpoints](../api/endpoints.md)** - Use the password endpoints
3. **[Security Headers](../security/security-headers.md)** - Additional security layers
4. **[Testing Guide](../testing/api-testing.md)** - Test password functionality

## 💡 Key Takeaways

Our password management system provides:
- **Security**: Industry-standard hashing and validation
- **User Experience**: Smooth change and reset flows
- **Scalability**: Efficient database design and cleanup
- **Auditability**: Complete security event logging
- **Flexibility**: Customizable policies and validation

Ready to implement secure password management? You now have a complete, production-ready system! 🔒
