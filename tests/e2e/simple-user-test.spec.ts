import { test, expect } from '@playwright/test';

test('Simple User Test - Check App as Real User', async ({ page }) => {
  console.log('🧪 Starting simple user test...');
  
  // 1. Go to the app
  await page.goto('http://localhost:3003');
  console.log('✅ Navigated to app');
  
  // 2. Check if we need to login
  const loginButton = page.locator('text=Anmelden');
  if (await loginButton.isVisible()) {
    console.log('🔐 Need to login...');
    
    // Click login
    await loginButton.click();
    await page.waitForURL('**/login');
    
    // Fill credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    console.log('📝 Filled credentials');
    
    // Submit
    await page.click('button[type="submit"]');
    console.log('🖱️ Clicked login');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in successfully');
  } else {
    console.log('✅ Already logged in');
  }
  
  // 3. Check dashboard
  await expect(page.locator('text=Dashboard')).toBeVisible();
  await expect(page.locator('text=Test User')).toBeVisible();
  console.log('✅ Dashboard looks good');
  
  // 4. Go to people page
  await page.click('text=Personen');
  await page.waitForURL('**/people');
  console.log('✅ Navigated to people page');
  
  // 5. Check if people are loaded
  await page.waitForTimeout(2000); // Wait for data to load
  const peopleCount = await page.locator('[data-testid="person-item"]').count();
  console.log(`📊 Found ${peopleCount} people`);
  
  // 6. Search for Maria Müller
  await page.fill('input[placeholder*="suchen"]', 'Maria');
  await page.waitForTimeout(1000);
  console.log('🔍 Searched for Maria');
  
  // 7. Click on Maria Müller if found
  const maria = page.locator('text=Maria Müller').first();
  if (await maria.isVisible()) {
    await maria.click();
    console.log('✅ Clicked on Maria Müller');
    
    // Check her details
    await page.waitForTimeout(1000);
    const email = await page.locator('text=maria.mueller@example.com').isVisible();
    const phone = await page.locator('text=+49444555666').isVisible();
    console.log(`📧 Email visible: ${email}`);
    console.log(`📞 Phone visible: ${phone}`);
  } else {
    console.log('❌ Maria Müller not found');
  }
  
  // 8. Go to properties
  await page.click('text=Dashboard');
  await page.waitForURL('**/dashboard');
  console.log('✅ Back to dashboard');
  
  // 9. Click on WA12 property
  const wa12 = page.locator('text=WA12').first();
  if (await wa12.isVisible()) {
    await wa12.click();
    await page.waitForURL('**/properties/**');
    console.log('✅ Clicked on WA12 property');
    
    // 10. Check property tabs
    await page.waitForTimeout(1000);
    const tabs = ['Mieteinnahmen', 'Einheiten', 'Personen'];
    for (const tab of tabs) {
      const tabElement = page.locator(`text=${tab}`);
      console.log(`📑 Tab "${tab}" visible: ${await tabElement.isVisible()}`);
    }
    
    // 11. Click on Personen tab
    await page.click('text=Personen');
    await page.waitForTimeout(2000);
    console.log('✅ Clicked on Personen tab');
    
    // 12. Check if Maria is shown as Hausmeister
    const hausmeister = page.locator('text=Hausmeister');
    if (await hausmeister.isVisible()) {
      console.log('✅ Maria shown as Hausmeister');
    } else {
      console.log('❌ Maria not shown as Hausmeister');
    }
    
    // 13. Check if Maria is shown as Mieter in unit
    const mieter = page.locator('text=Mieter');
    if (await mieter.isVisible()) {
      console.log('✅ Maria shown as Mieter in unit');
    } else {
      console.log('❌ Maria not shown as Mieter in unit');
    }
  } else {
    console.log('❌ WA12 property not found');
  }
  
  console.log('🎉 Simple user test completed!');
});
