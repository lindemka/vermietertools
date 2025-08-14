import { test, expect } from '@playwright/test';

test('Debug Login Issue', async ({ page }) => {
  console.log('🔍 Starting comprehensive login debug test...');
  
  // Step 1: Check initial state
  console.log('📋 Step 1: Checking initial state...');
  await page.goto('/debug');
  await page.waitForLoadState('networkidle');
  
  const initialCookies = await page.context().cookies();
  console.log('🍪 Initial cookies:', initialCookies);
  
  // Step 2: Go to login page
  console.log('📋 Step 2: Going to login page...');
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Verify login form is visible
  await expect(page.getByRole('heading', { name: 'Anmelden' })).toBeVisible();
  console.log('✅ Login form is visible');
  
  // Step 3: Fill in credentials
  console.log('📋 Step 3: Filling in credentials...');
  await page.getByLabel('E-Mail').fill('test@example.com');
  await page.getByLabel('Passwort').fill('password123');
  console.log('✅ Credentials filled');
  
  // Step 4: Monitor network requests
  console.log('📋 Step 4: Monitoring network requests...');
  const loginPromise = page.waitForResponse(response => 
    response.url().includes('/api/auth/login') && response.status() === 200
  );
  
  // Step 5: Click login button
  console.log('📋 Step 5: Clicking login button...');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  
  // Wait for the login response
  const loginResponse = await loginPromise;
  const responseData = await loginResponse.json();
  console.log('📊 Login response:', responseData);
  
  // Check response headers
  const responseHeaders = loginResponse.headers();
  console.log('📋 Response headers:', responseHeaders);
  
  // Step 6: Wait for navigation
  console.log('📋 Step 6: Waiting for navigation...');
  try {
    await page.waitForURL('/dashboard', { timeout: 10000 });
    console.log('✅ Successfully navigated to dashboard');
  } catch (error) {
    console.log('❌ Navigation failed:', error);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Check for error messages
    const errorText = await page.locator('body').textContent();
    console.log('📄 Page content:', errorText);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'login-debug-failure.png' });
    console.log('📸 Screenshot saved as login-debug-failure.png');
  }
  
  // Step 7: Check cookies after login attempt
  console.log('📋 Step 7: Checking cookies after login...');
  const cookiesAfterLogin = await page.context().cookies();
  console.log('🍪 Cookies after login:', cookiesAfterLogin);
  
  // Step 8: Check session via debug page
  console.log('📋 Step 8: Checking session via debug page...');
  await page.goto('/debug');
  await page.waitForLoadState('networkidle');
  
  const debugContent = await page.locator('body').textContent();
  console.log('📄 Debug page content:', debugContent);
  
  // Step 9: Check if we're actually logged in
  console.log('📋 Step 9: Final verification...');
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  
  const dashboardContent = await page.locator('body').textContent();
  console.log('📄 Dashboard content:', dashboardContent);
  
  // Check for specific elements
  const hasDashboardHeading = await page.getByRole('heading', { name: /Dashboard/i }).isVisible();
  const hasUserInfo = await page.getByText('Test User').isVisible();
  
  console.log('📊 Dashboard heading visible:', hasDashboardHeading);
  console.log('📊 User info visible:', hasUserInfo);
  
  // Final screenshot
  await page.screenshot({ path: 'login-debug-final.png' });
  console.log('📸 Final screenshot saved as login-debug-final.png');
  
  // Assertions
  expect(hasDashboardHeading).toBeTruthy();
  expect(hasUserInfo).toBeTruthy();
  
  console.log('🎉 Login debug test completed successfully!');
});
