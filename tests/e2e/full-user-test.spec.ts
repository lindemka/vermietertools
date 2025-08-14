import { test, expect } from '@playwright/test';

test('Full User Test - Simulate Real User Behavior', async ({ page }) => {
  console.log('🧪 Starting full user test...');
  
  // 1. Login
  await page.goto('http://localhost:3003/login');
  await page.waitForTimeout(1000);
  
  // Fill login form
  const emailLabel = page.locator('text=E-Mail');
  const emailInput = emailLabel.locator('..').locator('input').first();
  await emailInput.fill('test@example.com');
  
  const passwordLabel = page.locator('text=Passwort');
  const passwordInput = passwordLabel.locator('..').locator('input').first();
  await passwordInput.fill('password123');
  
  // Submit
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  
  // Wait for dashboard
  await page.waitForURL('**/dashboard');
  console.log('✅ Logged in successfully');
  
  // 2. Check dashboard
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  await expect(page.locator('text=Test User')).toBeVisible();
  console.log('✅ Dashboard loaded');
  
  // 3. Go to people page
  await page.click('text=Personen');
  await page.waitForURL('**/people');
  await page.waitForTimeout(2000); // Wait for data to load
  console.log('✅ Navigated to people page');
  
  // 4. Search for Maria Müller
  const searchInput = page.locator('input[placeholder*="suchen"]');
  await searchInput.fill('Maria');
  await page.waitForTimeout(1000);
  console.log('✅ Searched for Maria');
  
  // 5. Click on Maria Müller
  const maria = page.locator('text=Maria Müller').first();
  if (await maria.isVisible()) {
    await maria.click();
    await page.waitForTimeout(1000);
    console.log('✅ Clicked on Maria Müller');
    
    // Check her details
    const email = await page.locator('p:has-text("maria.mueller@example.com")').first().isVisible();
    const phone = await page.locator('p:has-text("+49444555666")').first().isVisible();
    const notes = await page.locator('p:has-text("1.OG rechts tenant")').first().isVisible();
    console.log(`📧 Email visible: ${email}`);
    console.log(`📞 Phone visible: ${phone}`);
    console.log(`📝 Notes visible: ${notes}`);
    
    // Check assignments
    const hausmeister = await page.locator('span:has-text("Hausmeister")').first().isVisible();
    const mieter = await page.locator('span:has-text("Mieter")').first().isVisible();
    console.log(`🏢 Hausmeister assignment: ${hausmeister}`);
    console.log(`🏠 Mieter assignment: ${mieter}`);
  } else {
    console.log('❌ Maria Müller not found');
  }
  
  // 6. Go back to dashboard
  await page.click('text=Dashboard');
  await page.waitForURL('**/dashboard');
  console.log('✅ Back to dashboard');
  
  // 7. Click on WA12 property
  const wa12 = page.locator('text=WA12').first();
  if (await wa12.isVisible()) {
    await wa12.click();
    await page.waitForURL('**/properties/**');
    await page.waitForTimeout(1000);
    console.log('✅ Clicked on WA12 property');
    
    // 8. Check property tabs
    const tabs = ['Mieteinnahmen', 'Einheiten', 'Personen'];
    for (const tab of tabs) {
      const tabElement = page.locator(`text=${tab}`);
      const isVisible = await tabElement.isVisible();
      console.log(`📑 Tab "${tab}": ${isVisible}`);
    }
    
    // 9. Click on Personen tab
    await page.click('text=Personen');
    await page.waitForTimeout(2000);
    console.log('✅ Clicked on Personen tab');
    
    // 10. Check if Maria is shown correctly
    const propertyHausmeister = await page.locator('text=Hausmeister').isVisible();
    const unitMieter = await page.locator('text=Mieter').isVisible();
    const unitName = await page.locator('text=2.OG links').isVisible();
    
    console.log(`🏢 Property Hausmeister: ${propertyHausmeister}`);
    console.log(`🏠 Unit Mieter: ${unitMieter}`);
    console.log(`🏠 Unit name (2.OG links): ${unitName}`);
    
    // 11. Check if both assignments are shown
    if (propertyHausmeister && unitMieter) {
      console.log('🎉 SUCCESS: Both Property and Unit assignments are visible!');
    } else {
      console.log('❌ ERROR: Not all assignments are visible');
    }
    
    // 12. Take screenshot for verification
    await page.screenshot({ path: 'test-results/property-people-tab.png' });
    console.log('📸 Screenshot saved');
    
  } else {
    console.log('❌ WA12 property not found');
  }
  
  console.log('🎉 Full user test completed!');
});
