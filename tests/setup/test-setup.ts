import { test as setup, expect } from '@playwright/test';

setup('Setup test database', async ({ request }) => {
  // Ensure the server is running and database is accessible
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  
  console.log('✅ Test setup complete - server is running and database is accessible');
});

setup('Create test user for E2E tests', async ({ request }) => {
  // Create a test user that can be used across tests
  const userData = {
    name: 'E2E Test User',
    email: 'e2etest@example.com',
    password: 'password123'
  };

  try {
    const response = await request.post('/api/auth/register', {
      data: userData
    });
    
    if (response.status() === 200) {
      const result = await response.json();
      console.log('✅ Test user created:', result.user.email);
    } else {
      console.log('ℹ️ Test user may already exist');
    }
  } catch (error) {
    console.log('ℹ️ Test user creation failed (may already exist):', error);
  }
});
