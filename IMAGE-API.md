# Image Upload API

This document outlines the image upload API endpoints available in the application. Images are stored using MinIO, an S3-compatible object storage service.

## Configuration

The following environment variables control the MinIO configuration:

```
MINIO_ENDPOINT=localhost       # MinIO server hostname/IP
MINIO_PORT=9000                # MinIO server port
MINIO_ACCESS_KEY=minioadmin    # MinIO access key
MINIO_SECRET_KEY=minioadmin    # MinIO secret key
MINIO_USE_SSL=false            # Whether to use HTTPS
MINIO_BUCKET=uploads           # Default bucket name
MINIO_PUBLIC_URL=http://localhost:9000/uploads  # Public URL for accessing images
```

## Setup MinIO locally

To run MinIO locally for development:

```bash
# Using Docker
docker run -p 9000:9000 -p 9001:9001 --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v ~/minio/data:/data \
  minio/minio server /data --console-address ":9001"
```

Access the MinIO Console at http://localhost:9001 with credentials minioadmin/minioadmin

## API Endpoints

All endpoints require authentication unless specified otherwise.

### Upload Single Image

Upload a single image to the server.

- **URL:** `/api/images/upload`
- **Method:** `POST`
- **Authentication:** Required
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `image`: The image file to upload

**Response:**

```json
{
  "success": true,
  "image": {
    "id": "cljkx1r2b00001d09jq7d5f8p",
    "filename": "example.jpg",
    "path": "general/c8e1f6e0-3b4d-4b1e-9f5a-0f5e5d5c5b5a.jpg",
    "url": "http://localhost:9000/uploads/general/c8e1f6e0-3b4d-4b1e-9f5a-0f5e5d5c5b5a.jpg",
    "mimeType": "image/jpeg",
    "size": 102400,
    "bucket": "uploads",
    "createdAt": "2025-07-10T12:34:56.789Z"
  }
}
```

### Upload User Avatar

Upload a user avatar image and update the user profile.

- **URL:** `/api/images/avatar`
- **Method:** `POST`
- **Authentication:** Required
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `avatar`: The avatar image file to upload

**Response:**

```json
{
  "success": true,
  "avatar": "http://localhost:9000/uploads/avatars/c8e1f6e0-3b4d-4b1e-9f5a-0f5e5d5c5b5a.jpg"
}
```

### Upload Post Images

Upload multiple images for a new post.

- **URL:** `/api/images/post`
- **Method:** `POST`
- **Authentication:** Required
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `images`: Multiple image files to upload
  - `content`: Optional post content/text

**Response:**

```json
{
  "success": true,
  "postId": "cljkx1r2b00001d09jq7d5f8p",
  "images": [
    {
      "id": "cljkx1r2b00011d09jq7d5f8q",
      "filename": "image1.jpg",
      "path": "posts/c8e1f6e0-3b4d-4b1e-9f5a-0f5e5d5c5b5a.jpg",
      "url": "http://localhost:9000/uploads/posts/c8e1f6e0-3b4d-4b1e-9f5a-0f5e5d5c5b5a.jpg",
      "mimeType": "image/jpeg",
      "size": 102400,
      "bucket": "uploads",
      "createdAt": "2025-07-10T12:34:56.789Z"
    },
    {
      "id": "cljkx1r2b00021d09jq7d5f8r",
      "filename": "image2.png",
      "path": "posts/d9f2e7d1-4c5e-5d6f-b8a9-9e8d7c6b5a4.png",
      "url": "http://localhost:9000/uploads/posts/d9f2e7d1-4c5e-5d6f-b8a9-9e8d7c6b5a4.png",
      "mimeType": "image/png",
      "size": 204800,
      "bucket": "uploads",
      "createdAt": "2025-07-10T12:34:56.789Z"
    }
  ]
}
```

### Add Images to Existing Post

Add images to an existing post.

- **URL:** `/api/images/post/:postId`
- **Method:** `POST`
- **Authentication:** Required
- **Content-Type:** `multipart/form-data`
- **URL Parameters:**
  - `postId`: ID of the existing post
- **Form Fields:**
  - `images`: Multiple image files to upload

**Response:**

```json
{
  "success": true,
  "postId": "cljkx1r2b00001d09jq7d5f8p",
  "images": [
    {
      "id": "cljkx1r2b00011d09jq7d5f8q",
      "filename": "image1.jpg",
      "path": "posts/c8e1f6e0-3b4d-4b1e-9f5a-0f5e5d5c5b5a.jpg",
      "url": "http://localhost:9000/uploads/posts/c8e1f6e0-3b4d-4b1e-9f5a-0f5e5d5c5b5a.jpg",
      "mimeType": "image/jpeg",
      "size": 102400,
      "bucket": "uploads",
      "createdAt": "2025-07-10T12:34:56.789Z"
    }
  ]
}
```

## Error Responses

All API endpoints return a standard error response format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common error status codes:

- `400`: Bad Request (invalid form data, missing files)
- `401`: Unauthorized (missing or invalid authentication)
- `403`: Forbidden (not allowed to access the resource)
- `404`: Not Found (post not found)
- `500`: Internal Server Error
