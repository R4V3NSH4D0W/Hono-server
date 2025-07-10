# 👥 Users API

User management endpoints for profiles, settings, and admin functions.

## 📚 Endpoints Overview

| Method | Endpoint                 | Purpose               | Auth Required | Role  |
| ------ | ------------------------ | --------------------- | ------------- | ----- |
| GET    | `/api/users/profile`     | Get user profile      | ✅            | Any   |
| PUT    | `/api/users/profile`     | Update profile        | ✅            | Any   |
| GET    | `/api/users/address`     | Get user addresses    | ✅            | Any   |
| POST   | `/api/users/address`     | Add new address       | ✅            | Any   |
| DELETE | `/api/users/address/:id` | Delete address        | ✅            | Any   |
| GET    | `/api/users/getAll`      | Get all users (admin) | ✅            | ADMIN |

---

## 1. Get User Profile

Get current user's profile information.

### Request

```http
GET /api/users/profile
Authorization: Bearer <access_token>
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
    "avatar": "avatar_filename.jpg",
    "role": "USER",
    "createdAt": "2025-07-10T10:30:00Z",
    "updatedAt": "2025-07-10T10:30:00Z"
  }
}
```

### Errors

- `401` - Not authenticated

---

## 2. Update User Profile

Update current user's profile information.

### Request

```http
PUT /api/users/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "Jane Doe",
  "phone": "+0987654321"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "cm123456789",
    "email": "user@example.com",
    "username": "Jane Doe",
    "phone": "+0987654321",
    "avatar": "avatar_filename.jpg",
    "role": "USER",
    "createdAt": "2025-07-10T10:30:00Z",
    "updatedAt": "2025-07-10T16:45:00Z"
  },
  "message": "Profile updated successfully"
}
```

### What you can update

- `username` - Display name
- `phone` - Phone number
- `avatar` - Use upload API first

### What you can't update

- `email` - Contact support to change
- `role` - Admin only
- `id` - Never changes

### Errors

- `401` - Not authenticated
- `400` - Invalid data format

---

## 3. Get User Addresses

Get all addresses for current user.

### Request

```http
GET /api/users/address
Authorization: Bearer <access_token>
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "addr_123",
      "name": "Home",
      "street": "123 Main St",
      "city": "New York",
      "zip": "10001",
      "phone": "+1234567890",
      "createdAt": "2025-07-10T10:30:00Z",
      "updatedAt": "2025-07-10T10:30:00Z"
    },
    {
      "id": "addr_456",
      "name": "Work",
      "street": "456 Office Blvd",
      "city": "New York",
      "zip": "10002",
      "phone": "+1234567891",
      "createdAt": "2025-07-10T11:00:00Z",
      "updatedAt": "2025-07-10T11:00:00Z"
    }
  ]
}
```

### Errors

- `401` - Not authenticated

---

## 4. Add New Address

Add a new address for current user.

### Request

```http
POST /api/users/address
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Home",
  "street": "123 Main St",
  "city": "New York",
  "zip": "10001",
  "phone": "+1234567890"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "id": "addr_789",
    "name": "Home",
    "street": "123 Main St",
    "city": "New York",
    "zip": "10001",
    "phone": "+1234567890",
    "createdAt": "2025-07-10T16:50:00Z",
    "updatedAt": "2025-07-10T16:50:00Z"
  },
  "message": "Address added successfully"
}
```

### Required Fields

- `name` - Address label (Home, Work, etc.)
- `street` - Street address
- `city` - City name
- `zip` - ZIP/postal code

### Optional Fields

- `phone` - Contact phone for this address

### Errors

- `401` - Not authenticated
- `400` - Missing required fields

---

## 5. Delete Address

Delete a specific address.

### Request

```http
DELETE /api/users/address/addr_123
Authorization: Bearer <access_token>
```

### Response

```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

### Errors

- `401` - Not authenticated
- `404` - Address not found
- `403` - Address belongs to another user

---

## 6. Get All Users (Admin Only)

Get list of all users (admin endpoint).

### Request

```http
GET /api/users/getAll
Authorization: Bearer <access_token>
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "cm123456789",
      "email": "user1@example.com",
      "username": "John Doe",
      "phone": "+1234567890",
      "avatar": "avatar1.jpg",
      "role": "USER",
      "createdAt": "2025-07-10T10:30:00Z",
      "updatedAt": "2025-07-10T10:30:00Z"
    },
    {
      "id": "cm987654321",
      "email": "admin@example.com",
      "username": "Admin User",
      "phone": "+0987654321",
      "avatar": null,
      "role": "ADMIN",
      "createdAt": "2025-07-09T15:20:00Z",
      "updatedAt": "2025-07-09T15:20:00Z"
    }
  ]
}
```

### Security Note

- Passwords are never included in responses
- Only admins can access this endpoint

### Errors

- `401` - Not authenticated
- `403` - Unauthorized access (not admin)

---

## 🔧 Frontend Integration

### React Profile Component

```javascript
const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const response = await apiCall('/api/users/profile');
      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        setFormData({
          username: data.data.username,
          phone: data.data.phone,
        });
      }
    };

    loadProfile();
  }, []);

  // Update profile
  const updateProfile = async () => {
    const response = await apiCall('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (data.success) {
      setUser(data.data);
      setEditing(false);
      alert('Profile updated!');
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2>User Profile</h2>

      {editing ? (
        <div>
          <input
            value={formData.username}
            onChange={e =>
              setFormData({ ...formData, username: e.target.value })
            }
            placeholder="Username"
          />
          <input
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone"
          />
          <button onClick={updateProfile}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <p>Name: {user.username}</p>
          <p>Email: {user.email}</p>
          <p>Phone: {user.phone}</p>
          <p>Role: {user.role}</p>
          <button onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
};
```

### Address Management

```javascript
const AddressManager = () => {
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    name: '',
    street: '',
    city: '',
    zip: '',
    phone: '',
  });

  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      const response = await apiCall('/api/users/address');
      const data = await response.json();

      if (data.success) {
        setAddresses(data.data);
      }
    };

    loadAddresses();
  }, []);

  // Add new address
  const addAddress = async () => {
    const response = await apiCall('/api/users/address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAddress),
    });

    const data = await response.json();

    if (data.success) {
      setAddresses([...addresses, data.data]);
      setNewAddress({ name: '', street: '', city: '', zip: '', phone: '' });
      alert('Address added!');
    }
  };

  // Delete address
  const deleteAddress = async id => {
    const response = await apiCall(`/api/users/address/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (data.success) {
      setAddresses(addresses.filter(addr => addr.id !== id));
      alert('Address deleted!');
    }
  };

  return (
    <div>
      <h2>My Addresses</h2>

      {/* Address List */}
      {addresses.map(address => (
        <div
          key={address.id}
          style={{ border: '1px solid #ccc', padding: '10px', margin: '10px' }}
        >
          <h4>{address.name}</h4>
          <p>{address.street}</p>
          <p>
            {address.city}, {address.zip}
          </p>
          <p>Phone: {address.phone}</p>
          <button onClick={() => deleteAddress(address.id)}>Delete</button>
        </div>
      ))}

      {/* Add New Address Form */}
      <div
        style={{ border: '2px dashed #ccc', padding: '10px', margin: '10px' }}
      >
        <h4>Add New Address</h4>
        <input
          placeholder="Name (Home, Work, etc.)"
          value={newAddress.name}
          onChange={e => setNewAddress({ ...newAddress, name: e.target.value })}
        />
        <input
          placeholder="Street Address"
          value={newAddress.street}
          onChange={e =>
            setNewAddress({ ...newAddress, street: e.target.value })
          }
        />
        <input
          placeholder="City"
          value={newAddress.city}
          onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
        />
        <input
          placeholder="ZIP Code"
          value={newAddress.zip}
          onChange={e => setNewAddress({ ...newAddress, zip: e.target.value })}
        />
        <input
          placeholder="Phone (optional)"
          value={newAddress.phone}
          onChange={e =>
            setNewAddress({ ...newAddress, phone: e.target.value })
          }
        />
        <button onClick={addAddress}>Add Address</button>
      </div>
    </div>
  );
};
```

## 🛡️ Security & Permissions

### User Roles

- **USER**: Can manage own profile and addresses
- **ADMIN**: Can view all users + everything USER can do
- **MODERATOR**: Future role for content moderation

### Data Protection

- Users can only access/modify their own data
- Admin endpoints require ADMIN role
- No sensitive data (passwords) in responses

### Privacy

- Phone numbers are optional
- Addresses are private to each user
- Email changes require special process (contact support)

## 💡 Tips

1. **Profile Updates**: Only send fields you want to change
2. **Address Management**: Use descriptive names (Home, Work, etc.)
3. **Admin Functions**: Check user role before showing admin UI
4. **Error Handling**: Always check response.success before using data
5. **Loading States**: Show loading indicators for better UX

## 🚨 Common Errors

| Status | Error                   | Solution                               |
| ------ | ----------------------- | -------------------------------------- |
| 401    | Not authenticated       | Login again or refresh token           |
| 403    | Unauthorized access     | Check user role/permissions            |
| 404    | Address not found       | Address may have been deleted          |
| 400    | Missing required fields | Check all required fields are provided |

Need file upload functionality? Check `../upload/upload-api.md` 📁
