import { test, expect } from '@playwright/test';

test('Test PropertyPeopleManager Direct', async ({ page }) => {
  console.log('🧪 Testing PropertyPeopleManager directly...');
  
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
  await page.click('text=Personen');
  await page.waitForTimeout(3000);
  console.log('✅ Clicked on Personen tab');
  
  // 4. Check for debug info and Maria Müller
  const debugInfo = page.locator('text=DEBUG:');
  const debugVisible = await debugInfo.isVisible();
  console.log(`🔍 Debug info visible: ${debugVisible}`);
  
  if (debugVisible) {
    const debugText = await debugInfo.textContent();
    console.log(`📋 Debug text: ${debugText}`);
  }
  
  const maria = page.locator('text=Maria Müller');
  const mariaVisible = await maria.isVisible();
  console.log(`🔍 Maria Müller visible: ${mariaVisible}`);
  
  if (mariaVisible) {
    console.log('✅ Maria Müller found');
    
    // 5. Check for her assignments
    const hausmeister = page.locator('text=Hausmeister');
    const mieter = page.locator('text=Mieter');
    const wa12Text = page.locator('text=WA12');
    const unitText = page.locator('text=2.OG links');
    
    const hausmeisterVisible = await hausmeister.isVisible();
    const mieterVisible = await mieter.isVisible();
    const wa12Visible = await wa12Text.isVisible();
    const unitVisible = await unitText.isVisible();
    
    console.log(`🏢 Hausmeister visible: ${hausmeisterVisible}`);
    console.log(`🏠 Mieter visible: ${mieterVisible}`);
    console.log(`🏢 WA12 visible: ${wa12Visible}`);
    console.log(`🏠 2.OG links visible: ${unitVisible}`);
    
    // 6. Check for assignment cards
    const blueCards = page.locator('.bg-blue-50');
    const greenCards = page.locator('.bg-green-50');
    
    const blueCardCount = await blueCards.count();
    const greenCardCount = await greenCards.count();
    
    console.log(`🔵 Blue cards (property assignments): ${blueCardCount}`);
    console.log(`🟢 Green cards (unit assignments): ${greenCardCount}`);
    
    // 7. Take screenshot
    await page.screenshot({ path: 'test-results/property-people-direct.png' });
    console.log('📸 Screenshot saved');
    
    // 8. Check if both assignments are shown
    if (hausmeisterVisible && mieterVisible) {
      console.log('🎉 SUCCESS: Both assignments are visible!');
    } else {
      console.log('❌ ERROR: Not all assignments are visible');
    }
  } else {
    console.log('❌ Maria Müller not found');
  }
  
  console.log('🎉 Test completed!');
});
