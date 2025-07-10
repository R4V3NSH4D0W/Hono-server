# Hono Server with JWT Authentication and File Uploads

A clean, organized REST API built with Hono framework, TypeScript, PostgreSQL, and Prisma ORM featuring JWT authentication and MinIO-based file uploads.

## Project Structure

```
src/
├── server.ts         # Main server entry point
├── routes/           # Route handlers
│   ├── health.ts     # Health check endpoints
│   ├── users.ts      # User management endpoints
│   └── images.ts     # Image upload endpoints
├── middleware/       # Middleware functions
│   ├── cors.ts       # CORS and other middleware
│   └── auth.ts       # JWT authentication middleware
├── services/         # Business logic layer
│   ├── user.ts       # User service with password hashing
│   └── storage/      # Storage services
│       ├── minio-config.ts  # MinIO client configuration
│       └── image-service.ts # Image upload helper functions
├── lib/              # Shared libraries
│   └── prisma.ts     # Prisma client initialization
├── types/            # TypeScript type definitions
│   └── index.ts      # Shared interfaces
└── generated/        # Auto-generated code
    └── prisma/       # Prisma client
```

## Available APIs

### Public Endpoints

- `GET /health` - Server health status
- `POST /api/users` - Create new user
- `POST /api/users/login` - Login to get JWT token

### Protected Endpoints (Requires JWT)

- `GET /api/users/profile` - Get current user profile (authenticated user)
- `POST /api/images/upload` - Upload a single image
- `POST /api/images/avatar` - Upload user avatar
- `POST /api/images/post` - Upload images with new post
- `POST /api/images/post/:postId` - Add images to existing post

## Development

```bash
# Install dependencies
npm install

# Setup storage for uploads (creates directories and starts MinIO if Docker is available)
./setup-storage.sh

# Start development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

## Example Usage

```bash
# Get all users
curl http://localhost:3000/api/users

# Get user by ID
curl http://localhost:3000/api/users/1

# Create new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com"}'

# Health check
curl http://localhost:3000/health
```

## Features

- ✅ Clean folder structure
- ✅ TypeScript support
- ✅ ESLint + Prettier
- ✅ Hot reload in development
- ✅ CORS enabled
- ✅ Request logging
- ✅ Error handling
- ✅ Format on save (VS Code)
- ✅ File uploads with MinIO (S3-compatible storage)
- ✅ Image processing and validation
- ✅ User avatar support
- ✅ Post image attachments

## Image Upload API

See [IMAGE-API.md](IMAGE-API.md) for detailed documentation on the image upload endpoints.

## CORS Configuration

This server includes comprehensive CORS (Cross-Origin Resource Sharing) configuration:

- **Development**: Automatically allows all localhost origins
- **Production**: Configure via `ALLOWED_ORIGINS` environment variable
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Security Headers**: Automatically added security headers
- **Request Tracking**: Unique request IDs for debugging

See [CORS.md](./CORS.md) for detailed configuration guide.

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. To access protected endpoints:

1. First, obtain a token by logging in:

   ```bash
   curl -X POST http://localhost:3000/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "yourpassword"}'
   ```

2. Use the returned token in the Authorization header:
   ```bash
   curl -X GET http://localhost:3000/api/users/profile \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## Example Requests

### Create User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "username": "testuser", "password": "securepassword123", "phone": "1234567890"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}'
```

### Get User Profile (Protected Route)

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt before storing in the database
- **JWT Authentication**: Secure token-based authentication for protected routes
- **Environment Variables**: Sensitive configuration like JWT_SECRET stored in environment variables
- **Token Expiration**: JWT tokens expire after 7 days by default

## File Uploads

This API supports file uploads using MinIO object storage. The `/api/images` endpoint allows authenticated users to upload and manage images.

### Upload Image

```bash
curl -X POST http://localhost:3000/api/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/your/image.jpg"
```

### Get Image Metadata

```bash
curl -X GET http://localhost:3000/api/images/IMAGE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Delete Image

```bash
curl -X DELETE http://localhost:3000/api/images/IMAGE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### List User Images

```bash
curl -X GET http://localhost:3000/api/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## MinIO Configuration

MinIO is used for file storage. Configure MinIO settings in `src/services/storage/minio-config.ts`.

- **Endpoint**: MinIO server URL
- **Access Key**: MinIO access key
- **Secret Key**: MinIO secret key
- **Bucket Name**: Default bucket for uploads

### Local MinIO Setup

For local development, you can run MinIO in a Docker container:

```bash
docker run -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e "MINIO_ACCESS_KEY=youraccesskey" \
  -e "MINIO_SECRET_KEY=yoursecretkey" \
  minio/minio server /data --console-address ":9001"
```

Access MinIO console at [http://localhost:9001](http://localhost:9001) with the access and secret keys configured above.

## Troubleshooting

- **CORS Issues**: Ensure `ALLOWED_ORIGINS` is set correctly in production.
- **JWT Errors**: Check `JWT_SECRET` and token expiration settings.
- **File Uploads**: Verify MinIO server is running and accessible.
