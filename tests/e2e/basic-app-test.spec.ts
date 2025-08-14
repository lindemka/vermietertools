import { test, expect } from '@playwright/test';

test('Basic App Test - Check if app loads', async ({ page }) => {
  console.log('🧪 Starting basic app test...');
  
  // 1. Go to the app
  await page.goto('http://localhost:3003');
  console.log('✅ Navigated to app');
  
  // 2. Take a screenshot to see what's there
  await page.screenshot({ path: 'test-results/app-homepage.png' });
  console.log('📸 Screenshot saved');
  
  // 3. Check if we're on login page or dashboard
  const pageContent = await page.content();
  console.log('📄 Page content length:', pageContent.length);
  
  // 4. Check for common elements
  const hasLogin = pageContent.includes('Anmelden') || pageContent.includes('Login');
  const hasDashboard = pageContent.includes('Dashboard');
  const hasVermietertools = pageContent.includes('Vermietertools');
  
  console.log(`🔍 Has login: ${hasLogin}`);
  console.log(`🔍 Has dashboard: ${hasDashboard}`);
  console.log(`🔍 Has Vermietertools: ${hasVermietertools}`);
  
  // 5. If we're on login page, try to login
  if (hasLogin) {
    console.log('🔐 Found login page, attempting login...');
    
    // Look for email input
    const emailInput = page.locator('#email, input[type="email"], input[placeholder*="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      console.log('✅ Filled email');
    } else {
      console.log('❌ Email input not found');
    }
    
    // Look for password input
    const passwordInput = page.locator('#password, input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('password123');
      console.log('✅ Filled password');
    } else {
      console.log('❌ Password input not found');
    }
    
    // Look for submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Anmelden"), button:has-text("Login")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      console.log('✅ Clicked submit');
      
      // Wait a bit and take another screenshot
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/after-login.png' });
      console.log('📸 After login screenshot saved');
    } else {
      console.log('❌ Submit button not found');
    }
  }
  
  // 6. Check final state
  const finalContent = await page.content();
  const finalUrl = page.url();
  console.log(`📍 Final URL: ${finalUrl}`);
  console.log(`📄 Final content length: ${finalContent.length}`);
  
  // 7. Check for success indicators
  const hasTestUser = finalContent.includes('Test User');
  const hasDashboardTitle = finalContent.includes('Dashboard');
  const hasProperties = finalContent.includes('WA12') || finalContent.includes('Objekt');
  
  console.log(`✅ Has Test User: ${hasTestUser}`);
  console.log(`✅ Has Dashboard: ${hasDashboardTitle}`);
  console.log(`✅ Has Properties: ${hasProperties}`);
  
  console.log('🎉 Basic app test completed!');
});
