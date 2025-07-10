# Hono Server with JWT Authentication

A clean, organized REST API built with Hono framework, TypeScript, PostgreSQL, and Prisma ORM featuring JWT authentication.

## Project Structure

```
src/
├── server.ts         # Main server entry point
├── routes/           # Route handlers
│   ├── health.ts     # Health check endpoints
│   └── users.ts      # User management endpoints
├── middleware/       # Middleware functions
│   ├── cors.ts       # CORS and other middleware
│   └── auth.ts       # JWT authentication middleware
├── services/         # Business logic layer
│   └── user.ts       # User service with password hashing
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

## Development

```bash
# Install dependencies
npm install

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
# Hono-server
