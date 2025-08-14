import { test, expect } from '@playwright/test';

test('Debug Login Page', async ({ page }) => {
  console.log('🧪 Starting debug login test...');
  
  // 1. Go directly to login page
  await page.goto('http://localhost:3003/login');
  console.log('✅ Navigated to login page');
  
  // 2. Wait for page to load
  await page.waitForTimeout(2000);
  
  // 3. Take screenshot
  await page.screenshot({ path: 'test-results/debug-login.png' });
  console.log('📸 Screenshot saved');
  
  // 4. Get page content
  const content = await page.content();
  console.log('📄 Content length:', content.length);
  
  // 5. Check for specific elements
  const hasAnmelden = content.includes('Anmelden');
  const hasEmail = content.includes('E-Mail');
  const hasPassword = content.includes('Passwort');
  const hasForm = content.includes('<form');
  const hasInput = content.includes('<input');
  
  console.log(`🔍 Has "Anmelden": ${hasAnmelden}`);
  console.log(`🔍 Has "E-Mail": ${hasEmail}`);
  console.log(`🔍 Has "Passwort": ${hasPassword}`);
  console.log(`🔍 Has form: ${hasForm}`);
  console.log(`🔍 Has input: ${hasInput}`);
  
  // 6. Try different selectors
  const selectors = [
    '#email',
    'input[type="email"]',
    'input[id="email"]',
    'input[placeholder*="email"]',
    'input[placeholder*="ihre"]',
    'input'
  ];
  
  for (const selector of selectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    console.log(`🔍 Selector "${selector}": ${count} elements`);
    
    if (count > 0) {
      const firstElement = elements.first();
      const isVisible = await firstElement.isVisible();
      const tagName = await firstElement.evaluate(el => el.tagName);
      const type = await firstElement.getAttribute('type');
      const id = await firstElement.getAttribute('id');
      console.log(`   - Visible: ${isVisible}, Tag: ${tagName}, Type: ${type}, ID: ${id}`);
    }
  }
  
  // 7. Try to find by text
  const emailLabel = page.locator('text=E-Mail');
  if (await emailLabel.isVisible()) {
    console.log('✅ Found "E-Mail" label');
    const emailInput = emailLabel.locator('..').locator('input').first();
    if (await emailInput.isVisible()) {
      console.log('✅ Found email input via label');
      await emailInput.fill('test@example.com');
      console.log('✅ Filled email');
    }
  }
  
  const passwordLabel = page.locator('text=Passwort');
  if (await passwordLabel.isVisible()) {
    console.log('✅ Found "Passwort" label');
    const passwordInput = passwordLabel.locator('..').locator('input').first();
    if (await passwordInput.isVisible()) {
      console.log('✅ Found password input via label');
      await passwordInput.fill('password123');
      console.log('✅ Filled password');
    }
  }
  
  // 8. Try to submit
  const submitButton = page.locator('button[type="submit"], button:has-text("Anmelden")');
  if (await submitButton.isVisible()) {
    console.log('✅ Found submit button');
    await submitButton.click();
    console.log('✅ Clicked submit');
    
    // Wait and check result
    await page.waitForTimeout(3000);
    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('/dashboard')) {
      console.log('🎉 Login successful!');
    } else {
      console.log('❌ Login failed, still on login page');
    }
  } else {
    console.log('❌ Submit button not found');
  }
  
  console.log('🎉 Debug login test completed!');
});
