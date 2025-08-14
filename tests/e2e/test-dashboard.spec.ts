import { test, expect } from '@playwright/test';

test('Test Dashboard - Check Properties Display', async ({ page }) => {
  console.log('🧪 Testing Dashboard...');
  
  // 1. Go to app and login
  await page.goto('http://localhost:3003');
  console.log('✅ Opened app');
  
  // Check if we need to login
  const loginButton = page.locator('text=Anmelden');
  if (await loginButton.isVisible()) {
    console.log('🔐 Need to login...');
    await loginButton.click();
    await page.waitForURL('**/login');
    
    // Fill credentials
    const emailLabel = page.locator('text=E-Mail');
    const emailInput = emailLabel.locator('..').locator('input').first();
    await emailInput.fill('test@example.com');
    
    const passwordLabel = page.locator('text=Passwort');
    const passwordInput = passwordLabel.locator('..').locator('input').first();
    await passwordInput.fill('password123');
    
    // Submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in successfully');
  } else {
    console.log('✅ Already logged in');
  }
  
  // 2. Check dashboard content
  const content = await page.content();
  console.log(`📄 Dashboard content length: ${content.length}`);
  
  // Check for specific elements
  const hasWA12 = content.includes('WA12');
  const hasWabestrasse = content.includes('Wabestraße');
  const hasProperties = content.includes('Ihre Objekte');
  const hasActiveProperties = content.includes('Aktive Objekte');
  
  console.log(`🔍 Has WA12: ${hasWA12}`);
  console.log(`🔍 Has Wabestraße: ${hasWabestrasse}`);
  console.log(`🔍 Has "Ihre Objekte": ${hasProperties}`);
  console.log(`🔍 Has "Aktive Objekte": ${hasActiveProperties}`);
  
  // 3. Check for property links
  const propertyLinks = page.locator('a[href*="/properties/"]');
  const propertyLinkCount = await propertyLinks.count();
  console.log(`📊 Property links found: ${propertyLinkCount}`);
  
  for (let i = 0; i < propertyLinkCount; i++) {
    const linkText = await propertyLinks.nth(i).textContent();
    const linkHref = await propertyLinks.nth(i).getAttribute('href');
    console.log(`   Link ${i}: "${linkText}" -> ${linkHref}`);
  }
  
  // 4. Check for WA12 specifically
  const wa12Elements = page.locator('text=WA12');
  const wa12Count = await wa12Elements.count();
  console.log(`📊 WA12 elements found: ${wa12Count}`);
  
  for (let i = 0; i < wa12Count; i++) {
    const elementText = await wa12Elements.nth(i).textContent();
    const elementTag = await wa12Elements.nth(i).evaluate(el => el.tagName);
    console.log(`   WA12 ${i}: "${elementText}" (${elementTag})`);
  }
  
  // 5. Take screenshot
  await page.screenshot({ path: 'test-results/dashboard-test.png' });
  console.log('📸 Screenshot saved');
  
  // 6. Check if we can click on WA12
  if (wa12Count > 0) {
    console.log('🔍 Trying to click on WA12...');
    await wa12Elements.first().click();
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/properties/')) {
      console.log('✅ Successfully navigated to property page');
      
      // Check property page content
      const propertyContent = await page.content();
      const hasPropertyName = propertyContent.includes('WA12');
      const hasPropertyAddress = propertyContent.includes('Wabestraße');
      
      console.log(`🔍 Property page - Has WA12: ${hasPropertyName}`);
      console.log(`🔍 Property page - Has Wabestraße: ${hasPropertyAddress}`);
      
      await page.screenshot({ path: 'test-results/property-page-test.png' });
      console.log('📸 Property page screenshot saved');
    } else {
      console.log('❌ Failed to navigate to property page');
    }
  } else {
    console.log('❌ No WA12 elements found to click');
  }
  
  console.log('🎉 Dashboard test completed!');
});
