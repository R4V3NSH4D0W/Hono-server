#!/usr/bin/env bash

# Simple API test script
# Make sure the server is running before executing this script

BASE_URL="http://localhost:3000"

echo "🧪 Testing Hono API..."
echo "========================"

# Test 1: Get API info
echo "1. Testing root endpoint..."
curl -s "$BASE_URL/" | jq '.'
echo -e "\n"

# Test 2: Health check
echo "2. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq '.'
echo -e "\n"

# Test 3: Get all users
echo "3. Getting all users..."
curl -s "$BASE_URL/api/users" | jq '.'
echo -e "\n"

# Test 4: Get user by ID
echo "4. Getting user by ID (1)..."
curl -s "$BASE_URL/api/users/1" | jq '.'
echo -e "\n"

# Test 5: Create new user
echo "5. Creating new user..."
curl -s -X POST "$BASE_URL/api/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com"}' | jq '.'
echo -e "\n"

# Test 6: Search users
echo "6. Searching users..."
curl -s "$BASE_URL/api/users/search/john" | jq '.'
echo -e "\n"

# Test 7: Test 404
echo "7. Testing 404 endpoint..."
curl -s "$BASE_URL/nonexistent" | jq '.'
echo -e "\n"

echo "✅ API tests completed!"
