# 📁 Upload API

File upload endpoints for avatars and other file management.

## 📚 Endpoints Overview

| Method | Endpoint | Purpose | Auth Required | File Types |
|--------|----------|---------|---------------|------------|
| POST | `/api/uploads/avatar` | Upload user avatar | ✅ | Images |
| POST | `/api/uploads/post/:postId/images` | Upload post images | ✅ | Images |
| GET | `/api/avatars/:filename` | Get avatar file | ❌ | Static |
| GET | `/api/posts/:postId/:filename` | Get post image | ❌ | Static |

---

## 1. Upload Avatar

Upload or update user's profile picture.

### Request
```http
POST /api/uploads/avatar
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Form Data:
- avatar: [image file]
```

### Response
```json
{
  "success": true,
  "data": {
    "filename": "440ce4a4-b87d-4dac-bc99-413ce59825a0.jpg",
    "url": "/api/avatars/440ce4a4-b87d-4dac-bc99-413ce59825a0.jpg",
    "size": 245760,
    "mimetype": "image/jpeg"
  },
  "message": "Avatar uploaded successfully"
}
```

### File Requirements
- **Max Size**: 10MB
- **Formats**: JPG, JPEG, PNG, GIF
- **Field Name**: `avatar` (important!)

### What Happens
- File is saved to `public/avatars/` directory
- Old avatar is automatically deleted
- User's avatar field is updated in database
- Unique filename is generated to prevent conflicts

### Errors
- `400` - No avatar file uploaded
- `400` - File too large
- `400` - Invalid file type
- `401` - Not authenticated

---

## 2. Upload Post Images

Upload images for a specific post.

### Request
```http
POST /api/uploads/post/123/images
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Form Data:
- images: [image file 1]
- images: [image file 2]
- images: [image file 3]
```

### Response
```json
{
  "success": true,
  "data": {
    "uploadedFiles": [
      {
        "filename": "123_image1_uuid.jpg",
        "url": "/api/posts/123/123_image1_uuid.jpg",
        "size": 345600,
        "mimetype": "image/jpeg"
      },
      {
        "filename": "123_image2_uuid.png",
        "url": "/api/posts/123/123_image2_uuid.png",
        "size": 128400,
        "mimetype": "image/png"
      }
    ],
    "totalFiles": 2,
    "totalSize": 474000
  },
  "message": "Images uploaded successfully"
}
```

### File Requirements
- **Max Size per file**: 10MB
- **Max files**: 10 per request
- **Formats**: JPG, JPEG, PNG, GIF
- **Field Name**: `images` (multiple files allowed)

### URL Parameters
- `postId`: The ID of the post these images belong to

### Errors
- `400` - No images uploaded
- `400` - Too many files
- `400` - File too large
- `400` - Invalid file type
- `401` - Not authenticated

---

## 3. Get Avatar File

Retrieve user avatar image (public endpoint).

### Request
```http
GET /api/avatars/440ce4a4-b87d-4dac-bc99-413ce59825a0.jpg
```

### Response
- Returns the actual image file
- Proper content-type headers
- Cached for performance

### URL Structure
```
/api/avatars/{filename}
```

### Notes
- No authentication required (public files)
- Files are served statically
- 404 if file doesn't exist

---

## 4. Get Post Image

Retrieve post image file (public endpoint).

### Request
```http
GET /api/posts/123/123_image1_uuid.jpg
```

### Response
- Returns the actual image file
- Proper content-type headers
- Cached for performance

### URL Structure
```
/api/posts/{postId}/{filename}
```

### Notes
- No authentication required (public files)
- Files are organized by post ID
- 404 if file doesn't exist

---

## 🔧 Frontend Integration

### Avatar Upload Component

```javascript
const AvatarUpload = ({ user, onAvatarUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await apiCall('/api/uploads/avatar', {
        method: 'POST',
        body: formData // Don't set Content-Type header, let browser set it
      });

      const data = await response.json();

      if (data.success) {
        onAvatarUpdate(data.data.url);
        alert('Avatar updated successfully!');
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avatar-upload">
      <div className="current-avatar">
        <img 
          src={user.avatar ? `/api/avatars/${user.avatar}` : '/default-avatar.png'}
          alt="Avatar"
          style={{ width: '100px', height: '100px', borderRadius: '50%' }}
        />
      </div>

      {preview && (
        <div className="preview">
          <img 
            src={preview}
            alt="Preview"
            style={{ width: '100px', height: '100px', borderRadius: '50%' }}
          />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          handleFileSelect(e);
          uploadAvatar(e);
        }}
        disabled={uploading}
      />

      {uploading && <p>Uploading...</p>}
    </div>
  );
};
```

### Multiple Image Upload

```javascript
const ImageUpload = ({ postId, onImagesUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);

    // Generate previews
    const previewPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previewPromises).then(setPreviews);
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await apiCall(`/api/uploads/post/${postId}/images`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        onImagesUploaded(data.data.uploadedFiles);
        setSelectedFiles([]);
        setPreviews([]);
        alert(`${data.data.totalFiles} images uploaded successfully!`);
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {previews.length > 0 && (
        <div className="previews">
          {previews.map((preview, index) => (
            <img
              key={index}
              src={preview}
              alt={`Preview ${index + 1}`}
              style={{ width: '100px', height: '100px', margin: '5px' }}
            />
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div>
          <p>{selectedFiles.length} files selected</p>
          <button onClick={uploadImages} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload Images'}
          </button>
        </div>
      )}
    </div>
  );
};
```

### Image Display Component

```javascript
const UserAvatar = ({ user, size = 50 }) => {
  const [imageError, setImageError] = useState(false);

  const avatarUrl = user.avatar && !imageError 
    ? `/api/avatars/${user.avatar}`
    : '/default-avatar.png';

  return (
    <img
      src={avatarUrl}
      alt={`${user.username}'s avatar`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover'
      }}
      onError={() => setImageError(true)}
    />
  );
};

const PostImages = ({ images, postId }) => {
  return (
    <div className="post-images">
      {images.map((image, index) => (
        <img
          key={index}
          src={`/api/posts/${postId}/${image.filename}`}
          alt={`Post image ${index + 1}`}
          style={{ maxWidth: '100%', margin: '5px' }}
        />
      ))}
    </div>
  );
};
```

## 🛡️ Security & Validation

### File Validation
- **Type checking**: Only image files allowed
- **Size limits**: 10MB per file maximum
- **Extension validation**: .jpg, .jpeg, .png, .gif
- **MIME type verification**: Validates actual file content

### Security Features
- **Unique filenames**: Prevents conflicts and enumeration
- **Path sanitization**: Prevents directory traversal
- **Size limits**: Prevents storage abuse
- **Rate limiting**: Prevents spam uploads

### Storage Security
- Files stored outside web root initially
- Served through controlled endpoints
- No executable file uploads
- Automatic cleanup of old files

## 📝 File Organization

### Directory Structure
```
public/
├── avatars/
│   ├── default-avatar.png
│   ├── user1-uuid.jpg
│   └── user2-uuid.png
└── posts/
    ├── post123/
    │   ├── image1-uuid.jpg
    │   └── image2-uuid.png
    └── post456/
        └── image1-uuid.gif
```

### Filename Format
- **Avatars**: `{uuid}.{extension}`
- **Post Images**: `{postId}_{original-name}_{uuid}.{extension}`

## 💡 Tips

1. **File Size**: Compress images before upload for better performance
2. **Previews**: Always show preview before upload
3. **Error Handling**: Handle network errors gracefully
4. **Progress**: Show upload progress for better UX
5. **Validation**: Validate files on client-side too
6. **Caching**: Use proper caching headers for static files

## 🚨 Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 400 | No file uploaded | Make sure file is selected and form field name matches |
| 400 | File too large | Compress image or choose smaller file |
| 400 | Invalid file type | Use JPG, PNG, or GIF images only |
| 401 | Not authenticated | Login and use valid access token |
| 413 | Payload too large | Server-level file size limit exceeded |

## 🔧 Configuration

### Environment Variables
```bash
# File upload settings
UPLOAD_MAX_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif

# Storage paths
AVATAR_UPLOAD_PATH=./public/avatars
POST_UPLOAD_PATH=./public/posts
```

### Server Configuration
- Max file size: 10MB
- Max files per request: 10
- Supported formats: JPG, PNG, GIF
- Storage: Local filesystem (can be extended to cloud storage)

That's it! You now have a complete, secure file upload system. 📸
