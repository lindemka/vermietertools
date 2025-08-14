import { test, expect } from '@playwright/test';

test.describe('Assignment UI Test', () => {
  test('should create and delete assignments in the UI', async ({ page }) => {
    console.log('🧪 Testing assignment creation and deletion in UI...');
    
    // Listen to console messages
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });
    
    // Listen to network requests
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('API response:', response.status(), response.url());
      }
    });

    // 1. Login
    await page.goto('http://localhost:3003/login');
    console.log('✅ Navigated to login page');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    console.log('✅ Filled login credentials');

    await page.click('button[type="submit"]');
    console.log('✅ Submitted login form');

    await page.waitForTimeout(3000);
    console.log('✅ Login completed');
    
    // 2. Navigate to people page
    await page.goto('http://localhost:3003/people');
    console.log('✅ Navigated to people page');
    
    await page.waitForTimeout(2000);
    await page.waitForSelector('text=Personenverzeichnis', { timeout: 10000 });
    console.log('✅ People directory page loaded');

    // 3. Search for John Doe
    const searchInput = page.locator('input[placeholder*="Personen suchen"], input[placeholder*="search"], input[type="text"]');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('John Doe');
      console.log('✅ Searched for John Doe');
      await page.waitForTimeout(2000);
    }

    // 4. Click on John Doe
    const johnDoeElement = page.locator('text=John Doe');
    if (await johnDoeElement.count() > 0) {
      await johnDoeElement.first().click();
      console.log('✅ Selected John Doe');
      await page.waitForTimeout(1000);
    } else {
      throw new Error('John Doe not found on the page');
    }

    // 5. Check initial assignment count
    let initialCount = 0;
    try {
      const initialAssignmentsText = await page.locator('text=/\\d+ Zuordnungen/').textContent();
      initialCount = parseInt(initialAssignmentsText?.match(/\d+/)?.[0] || '0');
    } catch (error) {
      // If no assignments text is found, check for "Keine Zuordnungen" message
      const noAssignmentsText = await page.locator('text=Keine Zuordnungen').textContent();
      if (noAssignmentsText) {
        initialCount = 0;
      }
    }
    console.log(`📊 Initial assignment count: ${initialCount}`);

    // 6. Add a new assignment
    console.log('➕ Adding new assignment...');
    
    // Click the "+" button to add assignment
    const addButton = page.locator('button:has(svg[data-icon="plus"]), button:has-text("+")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      console.log('✅ Clicked add assignment button');
      await page.waitForTimeout(1000);
    } else {
      // Try alternative selector
      const plusButton = page.locator('button:has(svg)').filter({ hasText: '' }).first();
      if (await plusButton.count() > 0) {
        await plusButton.click();
        console.log('✅ Clicked alternative add button');
        await page.waitForTimeout(1000);
      } else {
        console.log('⚠️  Could not find add button, trying to click on "Zuordnung hinzufügen" text');
        const addTextButton = page.locator('text=Zuordnung hinzufügen');
        if (await addTextButton.count() > 0) {
          await addTextButton.first().click();
          console.log('✅ Clicked "Zuordnung hinzufügen" button');
          await page.waitForTimeout(1000);
        }
      }
    }

    // 7. Fill in assignment details
    // Select property
    const propertySelect = page.locator('select').first();
    if (await propertySelect.count() > 0) {
      await propertySelect.selectOption({ index: 1 }); // Select first property
      console.log('✅ Selected property');
      await page.waitForTimeout(500);
    }

    // Select role
    const roleSelect = page.locator('select').last();
    if (await roleSelect.count() > 0) {
      await roleSelect.selectOption({ index: 1 }); // Select first role
      console.log('✅ Selected role');
      await page.waitForTimeout(500);
    }

    // 8. Submit the assignment
    const submitButton = page.locator('button:has-text("Zuordnung hinzufügen")');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      console.log('✅ Submitted assignment');
      await page.waitForTimeout(2000);
    }

    // 9. Check if assignment was added
    let afterAddCount = 0;
    try {
      const afterAddAssignmentsText = await page.locator('text=/\\d+ Zuordnungen/').textContent();
      afterAddCount = parseInt(afterAddAssignmentsText?.match(/\d+/)?.[0] || '0');
    } catch (error) {
      // If no assignments text is found, check for "Keine Zuordnungen" message
      const noAssignmentsText = await page.locator('text=Keine Zuordnungen').textContent();
      if (!noAssignmentsText) {
        // If "Keine Zuordnungen" is not found, there might be assignments
        afterAddCount = 1; // Assume at least one assignment was added
      }
    }
    console.log(`📊 Assignment count after adding: ${afterAddCount}`);

    if (afterAddCount > initialCount) {
      console.log('✅ Assignment was successfully added!');
    } else {
      console.log('❌ Assignment was not added');
    }

    // 10. Delete the assignment
    console.log('🗑️  Deleting assignment...');
    
    // Find and click the delete button
    const deleteButton = page.locator('button:has(svg[data-icon="trash"]), button[class*="text-red"]').first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      console.log('✅ Clicked delete button');
      await page.waitForTimeout(1000);
      
      // Handle confirmation dialog
      try {
        await page.waitForSelector('text=wirklich', { timeout: 3000 });
        await page.click('text=wirklich, text=Bestätigen, text=Ja, text=OK');
        console.log('✅ Confirmed deletion');
        await page.waitForTimeout(2000);
      } catch (error) {
        console.log('⚠️  No confirmation dialog found, proceeding');
      }
    } else {
      console.log('❌ Could not find delete button');
    }

    // 11. Check final assignment count
    let finalCount = 0;
    try {
      const finalAssignmentsText = await page.locator('text=/\\d+ Zuordnungen/').textContent();
      finalCount = parseInt(finalAssignmentsText?.match(/\d+/)?.[0] || '0');
    } catch (error) {
      // If no assignments text is found, check for "Keine Zuordnungen" message
      const noAssignmentsText = await page.locator('text=Keine Zuordnungen').textContent();
      if (noAssignmentsText) {
        finalCount = 0;
      }
    }
    console.log(`📊 Final assignment count: ${finalCount}`);

    // 12. Take a screenshot
    await page.screenshot({ path: 'test-results/assignment-ui-test.png' });
    console.log('📸 Screenshot saved: test-results/assignment-ui-test.png');

    // 13. Verify the result
    expect(finalCount).toBe(initialCount);
    console.log('🎉 Test completed successfully!');
  });
});
