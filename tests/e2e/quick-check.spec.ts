import { test, expect } from '@playwright/test';

test('Quick Check - Identify Main Issues', async ({ page }) => {
  console.log('🧪 Starting quick check...');
  
  // 1. Login
  await page.goto('http://localhost:3003/login');
  await page.waitForTimeout(1000);
  
  const emailLabel = page.locator('text=E-Mail');
  const emailInput = emailLabel.locator('..').locator('input').first();
  await emailInput.fill('test@example.com');
  
  const passwordLabel = page.locator('text=Passwort');
  const passwordInput = passwordLabel.locator('..').locator('input').first();
  await passwordInput.fill('password123');
  
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  await page.waitForURL('**/dashboard');
  console.log('✅ Logged in');
  
  // 2. Check dashboard content
  const content = await page.content();
  console.log(`📄 Dashboard content length: ${content.length}`);
  
  const hasWA12 = content.includes('WA12');
  const hasTestUser = content.includes('Test User');
  console.log(`🔍 Has WA12: ${hasWA12}`);
  console.log(`🔍 Has Test User: ${hasTestUser}`);
  
  // 3. Go to people page
  await page.click('text=Personen');
  await page.waitForURL('**/people');
  await page.waitForTimeout(2000);
  
  // 4. Check people content
  const peopleContent = await page.content();
  const hasMaria = peopleContent.includes('Maria Müller');
  const hasHausmeister = peopleContent.includes('Hausmeister');
  const hasMieter = peopleContent.includes('Mieter');
  console.log(`🔍 Has Maria Müller: ${hasMaria}`);
  console.log(`🔍 Has Hausmeister: ${hasHausmeister}`);
  console.log(`🔍 Has Mieter: ${hasMieter}`);
  
  // 5. Take screenshot
  await page.screenshot({ path: 'test-results/people-page-check.png' });
  console.log('📸 Screenshot saved');
  
  // 6. Try to find WA12 property link
  await page.goto('http://localhost:3003/dashboard');
  await page.waitForTimeout(1000);
  
  const wa12Link = page.locator('a:has-text("WA12"), button:has-text("WA12")');
  const wa12Count = await wa12Link.count();
  console.log(`🔍 WA12 elements found: ${wa12Count}`);
  
  if (wa12Count > 0) {
    console.log('✅ WA12 found, clicking...');
    await wa12Link.first().click();
    await page.waitForTimeout(2000);
    
    const propertyContent = await page.content();
    const hasPersonenTab = propertyContent.includes('Personen');
    console.log(`🔍 Has Personen tab: ${hasPersonenTab}`);
    
    if (hasPersonenTab) {
      await page.click('text=Personen');
      await page.waitForTimeout(2000);
      
      const tabContent = await page.content();
      const hasHausmeisterInTab = tabContent.includes('Hausmeister');
      const hasMieterInTab = tabContent.includes('Mieter');
      console.log(`🔍 Hausmeister in tab: ${hasHausmeisterInTab}`);
      console.log(`🔍 Mieter in tab: ${hasMieterInTab}`);
      
      await page.screenshot({ path: 'test-results/property-people-tab-check.png' });
      console.log('📸 Property tab screenshot saved');
    }
  }
  
  console.log('🎉 Quick check completed!');
});
