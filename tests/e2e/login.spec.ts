import { test, expect } from '@playwright/test';

test.describe('Login Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies();
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible();
    await expect(page.getByLabel('E-Mail')).toBeVisible();
    await expect(page.getByLabel('Passwort')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('invalid@example.com');
    await page.getByLabel('Passwort').fill('wrongpassword');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    await expect(page.getByText('Ungültige E-Mail oder Passwort')).toBeVisible();
  });

  test('should show error for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    // Check for HTML5 validation messages
    const emailInput = page.getByLabel('E-Mail');
    const passwordInput = page.getByLabel('Passwort');
    
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    console.log('🔍 Starting login test...');
    
    // Fill in valid credentials
    await page.getByLabel('E-Mail').fill('test@example.com');
    await page.getByLabel('Passwort').fill('password123');
    
    console.log('📝 Filled in credentials');
    
    // Click login button
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    console.log('🖱️ Clicked login button');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    console.log('✅ Navigated to dashboard');
    
    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    
    console.log('✅ Dashboard heading visible');
    
    // Check if user info is displayed
    await expect(page.getByText('Test User')).toBeVisible();
    
    console.log('✅ User name visible');
  });

  test('should maintain session after page reload', async ({ page }) => {
    // Login first
    await page.getByLabel('E-Mail').fill('test@example.com');
    await page.getByLabel('Passwort').fill('password123');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');
    
    // Reload the page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByText('Test User')).toBeVisible();
  });

  test('should redirect to dashboard if already logged in', async ({ page }) => {
    // Login first
    await page.getByLabel('E-Mail').fill('test@example.com');
    await page.getByLabel('Passwort').fill('password123');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');
    
    // Try to go to login page again
    await page.goto('/login');
    
    // Should be redirected to dashboard
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    // Fill in credentials
    await page.getByLabel('E-Mail').fill('test@example.com');
    await page.getByLabel('Passwort').fill('password123');
    
    // Click login and immediately check for loading state
    const loginButton = page.getByRole('button', { name: 'Anmelden' });
    await loginButton.click();
    
    // Should show loading text briefly
    await expect(page.getByText('Anmelden...')).toBeVisible();
    
    // Wait for navigation
    await page.waitForURL('/dashboard');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/auth/login', route => {
      route.abort('failed');
    });
    
    await page.getByLabel('E-Mail').fill('test@example.com');
    await page.getByLabel('Passwort').fill('password123');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    // Should show error message
    await expect(page.getByText('Ein Fehler ist aufgetreten')).toBeVisible();
  });

  test('should debug session cookies', async ({ page }) => {
    console.log('🔍 Testing session cookies...');
    
    // Go to debug page first to see initial state
    await page.goto('/debug');
    await expect(page.getByText('Session Status')).toBeVisible();
    
    // Check initial cookie state
    const cookies = await page.context().cookies();
    console.log('🍪 Initial cookies:', cookies);
    
    // Go to login
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('test@example.com');
    await page.getByLabel('Passwort').fill('password123');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    
    // Wait for navigation
    await page.waitForURL('/dashboard');
    
    // Check cookies after login
    const cookiesAfterLogin = await page.context().cookies();
    console.log('🍪 Cookies after login:', cookiesAfterLogin);
    
    // Go back to debug page to verify session
    await page.goto('/debug');
    await expect(page.getByText('✅ Angemeldet')).toBeVisible();
    
    // Check session info
    const sessionInfo = await page.locator('pre').first().textContent();
    console.log('📋 Session info:', sessionInfo);
  });
});
