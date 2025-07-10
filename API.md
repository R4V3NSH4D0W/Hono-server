# Hono API Documentation

A basic REST API built with Hono framework for managing users.

## Base URL

```
http://localhost:3000
```

## Endpoints

### Root

- **GET** `/` - API information and available endpoints

### Health Check

- **GET** `/health` - Server health status

### Users API

#### Get All Users

- **GET** `/api/users`
- Returns: List of all users

#### Get User by ID

- **GET** `/api/users/:id`
- Parameters: `id` (number) - User ID
- Returns: Single user object

#### Create New User

- **POST** `/api/users`
- Body:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com"
  }
  ```
- Returns: Created user object

#### Update User

- **PUT** `/api/users/:id`
- Parameters: `id` (number) - User ID
- Body:
  ```json
  {
    "name": "Updated Name",
    "email": "updated@example.com"
  }
  ```
- Returns: Updated user object

#### Delete User

- **DELETE** `/api/users/:id`
- Parameters: `id` (number) - User ID
- Returns: Deleted user object

#### Search Users

- **GET** `/api/users/search/:query`
- Parameters: `query` (string) - Search term (searches name and email)
- Returns: Array of matching users

## Example Requests

### Using curl

```bash
# Get all users
curl http://localhost:3000/api/users

# Get user by ID
curl http://localhost:3000/api/users/1

# Create new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com"}'

# Update user
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "John Updated"}'

# Delete user
curl -X DELETE http://localhost:3000/api/users/1

# Search users
curl http://localhost:3000/api/users/search/john
```

### Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": {...},
  "message": "Optional message",
  "count": "Number of items (for lists)"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Features

- ✅ CORS enabled
- ✅ Request logging
- ✅ Pretty JSON responses
- ✅ Error handling
- ✅ Input validation
- ✅ TypeScript support
- ✅ Hot reload in development

## Development

```bash
# Start development server
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
