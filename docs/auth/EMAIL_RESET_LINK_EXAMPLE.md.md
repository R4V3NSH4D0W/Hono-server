# 📧 Email Reset Link Example

## 🎯 **Real Example from Your System**

When a user requests password reset, here's **exactly** what happens:

---

## 📨 **What the User Receives**

### **Email Subject**: "Password Reset Request"

### **Email Content**:

```
Hi Test User,

You requested to reset your password for your account.

Click the link below to reset your password:

🔗 Reset Password: http://localhost:3000/reset-password?token=664b682df4f745dd5b859d0a6c1df2d9d398c178fed434f536765a385057c164

Or copy and paste this link in your browser:
http://localhost:3000/reset-password?token=664b682df4f745dd5b859d0a6c1df2d9d398c178fed434f536765a385057c164

⏰ This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
Your App Team
```

---

## 🔗 **What Happens When User Clicks the Link**

### **1. User Clicks Email Link**

```
URL: http://localhost:3000/reset-password?token=664b682df4f745dd5b859d0a6c1df2d9d398c178fed434f536765a385057c164
```

### **2. Your Frontend Page Loads**

```javascript
// Frontend extracts token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
// token = "664b682df4f745dd5b859d0a6c1df2d9d398c178fed434f536765a385057c164"
```

### **3. Frontend Validates Token (Optional but Recommended)**

```javascript
const response = await fetch(`/api/auth/reset-password/validate/${token}`);
if (response.ok) {
  // Show password reset form
  showPasswordResetForm();
} else {
  // Show error: "Invalid or expired link"
  showError('This reset link is invalid or has expired.');
}
```

### **4. User Enters New Password**

```javascript
const newPassword = document.getElementById('newPassword').value;

const response = await fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: token, // The token from the URL
    newPassword: newPassword,
  }),
});

if (response.ok) {
  // Success! Redirect to login
  window.location.href = '/login';
}
```

---

## 🌐 **Production URL Example**

In production, the email would contain:

```
https://yourapp.com/reset-password?token=664b682df4f745dd5b859d0a6c1df2d9d398c178fed434f536765a385057c164
```

---

## 🔧 **Frontend Implementation Templates**

### **React/Next.js Example**

```jsx
// pages/reset-password.js or app/reset-password/page.js
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [isValidToken, setIsValidToken] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(
        `/api/auth/reset-password/validate/${token}`
      );
      if (response.ok) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
      }
    } catch (error) {
      setIsValidToken(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async e => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      if (response.ok) {
        alert('Password reset successful!');
        router.push('/login');
      } else {
        alert('Failed to reset password');
      }
    } catch (error) {
      alert('Error resetting password');
    }
  };

  if (loading) return <div>Validating reset link...</div>;

  if (!isValidToken) {
    return (
      <div>
        <h2>Invalid Reset Link</h2>
        <p>This password reset link is invalid or has expired.</p>
        <a href="/forgot-password">Request a new reset link</a>
      </div>
    );
  }

  return (
    <div>
      <h2>Reset Your Password</h2>
      <form onSubmit={handleResetPassword}>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}
```

### **Vanilla HTML/JavaScript**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Reset Password</title>
  </head>
  <body>
    <div id="loading">Validating reset link...</div>

    <div id="invalidToken" style="display: none;">
      <h2>Invalid Reset Link</h2>
      <p>This password reset link is invalid or has expired.</p>
      <a href="/forgot-password">Request a new reset link</a>
    </div>

    <div id="resetForm" style="display: none;">
      <h2>Reset Your Password</h2>
      <form id="passwordResetForm">
        <input
          type="password"
          id="newPassword"
          placeholder="New Password"
          required
        />
        <input
          type="password"
          id="confirmPassword"
          placeholder="Confirm Password"
          required
        />
        <button type="submit">Reset Password</button>
      </form>
    </div>

    <script>
      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      // Validate token on page load
      async function validateToken() {
        try {
          const response = await fetch(
            `/api/auth/reset-password/validate/${token}`
          );

          document.getElementById('loading').style.display = 'none';

          if (response.ok) {
            document.getElementById('resetForm').style.display = 'block';
          } else {
            document.getElementById('invalidToken').style.display = 'block';
          }
        } catch (error) {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('invalidToken').style.display = 'block';
        }
      }

      // Handle form submission
      document.getElementById('passwordResetForm').onsubmit = async e => {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword =
          document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
          alert('Passwords do not match');
          return;
        }

        try {
          const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
          });

          if (response.ok) {
            alert('Password reset successful!');
            window.location.href = '/login';
          } else {
            const data = await response.json();
            alert(data.error || 'Failed to reset password');
          }
        } catch (error) {
          alert('Error resetting password');
        }
      };

      // Validate token when page loads
      if (token) {
        validateToken();
      } else {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('invalidToken').style.display = 'block';
      }
    </script>
  </body>
</html>
```

---

## 🎯 **Summary**

**Your backend is 100% ready!** Here's what users experience:

1. **User clicks "Forgot Password?"** on your login page
2. **User enters email** on your forgot password page
3. **User receives email** with reset link (like the example above)
4. **User clicks email link** → Goes to your reset password page
5. **Your frontend validates token** and shows password form
6. **User sets new password** → Your backend processes it
7. **Success!** User can login with new password

**The only thing you need to build is the frontend pages!** Your backend handles all the security, token generation, validation, and password updating. 🚀

Would you like me to help you with the email service configuration next?
