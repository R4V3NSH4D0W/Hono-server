// Example API usage for Hono server

const BASE_URL = 'http://localhost:3000';

// Example 1: Health Check
async function checkHealth() {
  const response = await fetch(`${BASE_URL}/health`);
  const data = await response.json();
  console.log('Health:', data);
}

// Example 2: Get all users
async function getAllUsers() {
  const response = await fetch(`${BASE_URL}/api/users`);
  const data = await response.json();
  console.log('All users:', data);
}

// Example 3: Get user by ID
async function getUser(id: string) {
  const response = await fetch(`${BASE_URL}/api/users/${id}`);
  const data = await response.json();
  console.log(`User ${id}:`, data);
}

// Example 4: Create new user
async function createUser(name: string, email: string) {
  const response = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email }),
  });
  const data = await response.json();
  console.log('Created user:', data);
}

// Run examples (uncomment to use)
// async function runExamples() {
//   console.log('🧪 Testing Hono API...\n');

//   await checkHealth();
//   await getAllUsers();
//   await getUser(1);
//   await createUser('Test User', 'test@example.com');
// }

// runExamples();

export { checkHealth, getAllUsers, getUser, createUser };
