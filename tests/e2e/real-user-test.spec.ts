import { test, expect } from '@playwright/test';

test('Real User Test - Check Property People Tab', async ({ page }) => {
  console.log('🧪 Starting real user test...');
  
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
  
  // 2. Find and click on WA12
  console.log('🔍 Looking for WA12...');
  const wa12Link = page.locator('a:has-text("WA12"), button:has-text("WA12")');
  const wa12Count = await wa12Link.count();
  console.log(`📊 Found ${wa12Count} WA12 elements`);
  
  if (wa12Count > 0) {
    await wa12Link.first().click();
    await page.waitForURL('**/properties/**');
    await page.waitForTimeout(2000);
    console.log('✅ Clicked on WA12');
    
    // 3. Check what tabs are available
    const tabs = page.locator('button');
    const tabCount = await tabs.count();
    console.log(`📊 Found ${tabCount} tabs`);
    
    for (let i = 0; i < Math.min(tabCount, 10); i++) {
      const tabText = await tabs.nth(i).textContent();
      console.log(`   Tab ${i}: "${tabText}"`);
    }
    
    // 4. Click on Personen tab
    const personenTab = page.locator('button:has-text("Personen")');
    const personenTabCount = await personenTab.count();
    console.log(`📊 Found ${personenTabCount} Personen tabs`);
    
    if (personenTabCount > 0) {
      await personenTab.first().click();
      await page.waitForTimeout(3000);
      console.log('✅ Clicked on Personen tab');
      
      // 5. Check what's displayed
      const content = await page.content();
      console.log(`📄 Content length: ${content.length}`);
      
      // Check for specific elements
      const hasMaria = content.includes('Maria Müller');
      const hasHausmeister = content.includes('Hausmeister');
      const hasMieter = content.includes('Mieter');
      const hasWA12 = content.includes('WA12');
      const has2OG = content.includes('2.OG links');
      
      console.log(`🔍 Has Maria Müller: ${hasMaria}`);
      console.log(`🔍 Has Hausmeister: ${hasHausmeister}`);
      console.log(`🔍 Has Mieter: ${hasMieter}`);
      console.log(`🔍 Has WA12: ${hasWA12}`);
      console.log(`🔍 Has 2.OG links: ${has2OG}`);
      
      // 6. Check for assignment cards
      const blueCards = page.locator('.bg-blue-50');
      const greenCards = page.locator('.bg-green-50');
      
      const blueCardCount = await blueCards.count();
      const greenCardCount = await greenCards.count();
      
      console.log(`🔵 Blue cards (property assignments): ${blueCardCount}`);
      console.log(`🟢 Green cards (unit assignments): ${greenCardCount}`);
      
      // 7. Take screenshot
      await page.screenshot({ path: 'test-results/real-user-property-people.png' });
      console.log('📸 Screenshot saved');
      
      // 8. Check if both assignments are shown
      if (hasHausmeister && hasMieter) {
        console.log('🎉 SUCCESS: Both assignments are visible!');
      } else {
        console.log('❌ ERROR: Not all assignments are visible');
        
        // 9. Go to people directory to compare
        console.log('🔍 Going to people directory to compare...');
        await page.click('text=Personen');
        await page.waitForURL('**/people');
        await page.waitForTimeout(2000);
        
        const peopleContent = await page.content();
        const peopleHasMaria = peopleContent.includes('Maria Müller');
        const peopleHasHausmeister = peopleContent.includes('Hausmeister');
        const peopleHasMieter = peopleContent.includes('Mieter');
        
        console.log(`👥 People directory - Has Maria: ${peopleHasMaria}`);
        console.log(`👥 People directory - Has Hausmeister: ${peopleHasMieter}`);
        console.log(`👥 People directory - Has Mieter: ${peopleHasMieter}`);
        
        await page.screenshot({ path: 'test-results/real-user-people-directory.png' });
        console.log('📸 People directory screenshot saved');
      }
    } else {
      console.log('❌ Personen tab not found');
    }
  } else {
    console.log('❌ WA12 not found');
  }
  
  console.log('🎉 Real user test completed!');
});
