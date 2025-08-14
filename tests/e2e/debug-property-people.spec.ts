import { test, expect } from '@playwright/test';

test('Debug PropertyPeopleManager Component', async ({ page }) => {
  console.log('🧪 Debugging PropertyPeopleManager component...');
  
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
  
  // 2. Go to WA12 property
  const wa12 = page.locator('a:has-text("WA12"), button:has-text("WA12")');
  await wa12.first().click();
  await page.waitForURL('**/properties/**');
  await page.waitForTimeout(1000);
  console.log('✅ Navigated to WA12 property');
  
  // 3. Click on Personen tab
  const personenTab = page.locator('text=Personen');
  const isPersonenTabVisible = await personenTab.isVisible();
  console.log(`🔍 Personen tab visible: ${isPersonenTabVisible}`);
  
  if (isPersonenTabVisible) {
    await personenTab.click();
    await page.waitForTimeout(2000);
    console.log('✅ Clicked on Personen tab');
  } else {
    console.log('❌ Personen tab not found');
    // List all tabs
    const allTabs = page.locator('button');
    const tabCount = await allTabs.count();
    console.log(`📊 Found ${tabCount} buttons`);
    
    for (let i = 0; i < Math.min(tabCount, 10); i++) {
      const tabText = await allTabs.nth(i).textContent();
      console.log(`   Tab ${i}: "${tabText}"`);
    }
  }
  
  // 4. Check what's actually rendered
  const content = await page.content();
  console.log(`📄 Content length: ${content.length}`);
  
  // 5. Check for specific elements
  const hasMaria = content.includes('Maria Müller');
  const hasHausmeister = content.includes('Hausmeister');
  const hasMieter = content.includes('Mieter');
  const hasWA12 = content.includes('WA12');
  const has2OG = content.includes('2.OG links');
  const hasDebug = content.includes('DEBUG:');
  const hasPropertyPeopleManager = content.includes('PropertyPeopleManager');
  
  console.log(`🔍 Has Maria Müller: ${hasMaria}`);
  console.log(`🔍 Has Hausmeister: ${hasHausmeister}`);
  console.log(`🔍 Has Mieter: ${hasMieter}`);
  console.log(`🔍 Has WA12: ${hasWA12}`);
  console.log(`🔍 Has 2.OG links: ${has2OG}`);
  console.log(`🔍 Has DEBUG text: ${hasDebug}`);
  console.log(`🔍 Has PropertyPeopleManager: ${hasPropertyPeopleManager}`);
  
  // 6. Check for specific UI elements
  const peopleCards = page.locator('[class*="Card"]');
  const peopleCount = await peopleCards.count();
  console.log(`📊 People cards found: ${peopleCount}`);
  
  // 7. Check for assignment elements
  const propertyAssignments = page.locator('text=Hausmeister');
  const unitAssignments = page.locator('text=Mieter');
  const propertyCount = await propertyAssignments.count();
  const unitCount = await unitAssignments.count();
  
  console.log(`🏢 Property assignments found: ${propertyCount}`);
  console.log(`🏠 Unit assignments found: ${unitCount}`);
  
  // 8. Take screenshot
  await page.screenshot({ path: 'test-results/debug-property-people.png' });
  console.log('📸 Screenshot saved');
  
  // 9. Check console for errors
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    consoleLogs.push(msg.text());
    console.log(`📋 Console: ${msg.text()}`);
  });
  
  // 10. Check network requests
  const networkRequests: string[] = [];
  page.on('response', response => {
    if (response.url().includes('/api/people')) {
      const req = `${response.status()} ${response.url()}`;
      networkRequests.push(req);
      console.log(`🌐 Network: ${req}`);
    }
  });
  
  // Wait a bit for any async operations
  await page.waitForTimeout(3000);
  
  console.log('\n📋 All console logs:');
  consoleLogs.forEach(log => console.log(`   ${log}`));
  
  console.log('\n🌐 All network requests:');
  networkRequests.forEach(req => console.log(`   ${req}`));
  
  console.log('🎉 Debug completed!');
});
