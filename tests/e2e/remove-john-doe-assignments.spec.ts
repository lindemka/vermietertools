import { test, expect } from '@playwright/test';

test.describe('Remove John Doe Assignments', () => {
  test('should remove all assignments for John Doe through the UI', async ({ page }) => {
    console.log('🧪 Starting John Doe assignment removal test...');
    
    // Listen to console messages
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });
    
    // Listen to network requests
    page.on('response', response => {
      if (response.url().includes('/api/people')) {
        console.log('People API response:', response.status(), response.url());
      }
    });

    // 1. First, login to get proper session cookies
    await page.goto('http://localhost:3003/login');
    console.log('✅ Navigated to login page');
    
    // Fill in login credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    console.log('✅ Filled login credentials');

    // Submit login form
    await page.click('button[type="submit"]');
    console.log('✅ Submitted login form');

    // Wait for login to complete and redirect
    await page.waitForTimeout(3000);
    console.log('✅ Login completed');
    
    // 2. Now navigate to the people page with proper session
    await page.goto('http://localhost:3003/people');
    console.log('✅ Navigated to people page');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);

    // 3. Wait for people page to load
    await page.waitForSelector('text=Personenverzeichnis', { timeout: 10000 });
    console.log('✅ People directory page loaded');

    // 4. Take a screenshot to see what's on the page
    await page.screenshot({ path: 'test-results/people-page-before-search.png' });
    console.log('📸 Screenshot saved: people-page-before-search.png');

    // 5. Check what people are visible on the page
    const peopleElements = await page.locator('div[class*="p-4 border-b"], div[class*="cursor-pointer"]').count();
    console.log(`📊 Found ${peopleElements} person elements on the page`);

    // 6. Search for John Doe
    const searchInput = page.locator('input[placeholder*="Personen suchen"], input[placeholder*="search"], input[type="text"]');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('John Doe');
      console.log('✅ Searched for John Doe');
      
      // Wait a moment for search results
      await page.waitForTimeout(2000);
      
      // Take another screenshot after search
      await page.screenshot({ path: 'test-results/people-page-after-search.png' });
      console.log('📸 Screenshot saved: people-page-after-search.png');
    } else {
      console.log('⚠️  No search input found');
    }

    // 7. Try to find John Doe with different selectors
    const johnDoeSelectors = [
      'text=John Doe',
      '[data-testid*="john-doe"]',
      '[class*="john-doe"]',
      'div:has-text("John Doe")',
      'a:has-text("John Doe")',
      'button:has-text("John Doe")'
    ];
    
    let johnDoeFound = false;
    for (const selector of johnDoeSelectors) {
      const elements = page.locator(selector);
      if (await elements.count() > 0) {
        console.log(`✅ Found John Doe with selector: ${selector}`);
        await elements.first().click();
        johnDoeFound = true;
        break;
      }
    }
    
    if (!johnDoeFound) {
      console.log('❌ John Doe not found with any selector');
      // Take a screenshot to see what's available
      await page.screenshot({ path: 'test-results/john-doe-not-found.png' });
      console.log('📸 Screenshot saved: john-doe-not-found.png');
      
      // List all text content on the page to debug
      const allText = await page.locator('body').textContent();
      console.log('📄 Page content preview:', allText?.substring(0, 500));
      
      throw new Error('John Doe not found on the page');
    }
    
    console.log('✅ Selected John Doe');

    // 6. Wait for John Doe's details to load
    await page.waitForSelector('text=John Doe', { state: 'visible' });
    console.log('✅ John Doe details loaded');

    // 7. Check how many assignments John Doe has
    const assignmentsText = await page.locator('text=/\\d+ Zuordnungen/').textContent();
    const assignmentCount = parseInt(assignmentsText?.match(/\d+/)?.[0] || '0');
    console.log(`📊 John Doe has ${assignmentCount} assignments`);

    // 8. Take a screenshot before removal
    await page.screenshot({ path: 'test-results/john-doe-before-removal.png' });
    console.log('📸 Screenshot saved: test-results/john-doe-before-removal.png');

    // 9. Remove all assignments one by one
    for (let i = 0; i < assignmentCount; i++) {
      console.log(`🗑️  Removing assignment ${i + 1} of ${assignmentCount}`);
      
      // Wait a moment for the UI to be ready
      await page.waitForTimeout(1000);
      
      // Look for delete buttons in the assignments section
      // Try different selectors for the delete buttons
      const deleteSelectors = [
        'button:has(svg[data-icon="trash"])',
        'button:has(svg[data-icon="x"])',
        'button[aria-label*="Löschen"]',
        'button[title*="Löschen"]',
        'button[class*="text-red"]',
        'button[class*="hover:text-red"]',
        'button:has-text("×")',
        'button:has-text("X")',
        '[data-testid="delete-assignment"]',
        // More specific selectors for the assignment delete buttons
        'div[class*="bg-blue-50"] button:has(svg)',
        'div[class*="bg-green-50"] button:has(svg)',
        'div[class*="rounded-lg"] button:has(svg)'
      ];
      
      let deleteButton = null;
      for (const selector of deleteSelectors) {
        const buttons = page.locator(selector);
        if (await buttons.count() > 0) {
          deleteButton = buttons.first();
          console.log(`✅ Found delete button with selector: ${selector}`);
          break;
        }
      }
      
      if (deleteButton) {
        // Click the delete button
        await deleteButton.click();
        console.log(`✅ Clicked delete button for assignment ${i + 1}`);
      } else {
        // Debug: List all buttons on the page
        console.log(`❌ No delete button found for assignment ${i + 1}`);
        
        // Check for buttons specifically in assignment areas
        const assignmentButtons = await page.locator('div[class*="bg-blue-50"], div[class*="bg-green-50"] button').all();
        console.log(`📊 Found ${assignmentButtons.length} buttons in assignment areas`);
        
        const allButtons = await page.locator('button').all();
        console.log(`📊 Found ${allButtons.length} total buttons on the page`);
        
        for (let j = 0; j < Math.min(allButtons.length, 10); j++) {
          const button = allButtons[j];
          const text = await button.textContent();
          const className = await button.getAttribute('class');
          console.log(`  Button ${j + 1}: "${text}" (class: ${className})`);
        }
        
        // Also check for any elements with trash or delete icons
        const trashElements = await page.locator('svg, [class*="trash"], [class*="delete"]').all();
        console.log(`📊 Found ${trashElements.length} potential trash/delete elements`);
        
        for (let j = 0; j < Math.min(trashElements.length, 5); j++) {
          const element = trashElements[j];
          const tagName = await element.evaluate(el => el.tagName);
          const className = await element.getAttribute('class');
          console.log(`  Element ${j + 1}: ${tagName} (class: ${className})`);
        }
      }
      
      if (deleteButton) {
        // Wait for confirmation dialog and confirm
        try {
          await page.waitForSelector('text=Bestätigen, text=Ja, text=OK, text=Entfernen, text=Confirm, text=wirklich', { timeout: 3000 });
          await page.click('text=Bestätigen, text=Ja, text=OK, text=Entfernen, text=Confirm, text=wirklich');
          console.log(`✅ Confirmed deletion for assignment ${i + 1}`);
        } catch (error) {
          console.log(`⚠️  No confirmation dialog found for assignment ${i + 1}, trying to proceed without confirmation`);
          
          // Try to handle the case where there's no confirmation dialog
          // The deletion might happen immediately
          await page.waitForTimeout(1000);
        }
        
        // Wait for the removal to process
        await page.waitForTimeout(2000);
        
        // Refresh the page to see if the assignment was removed
        await page.reload();
        await page.waitForTimeout(2000);
        
        // Re-select John Doe after page refresh
        const searchInput = page.locator('input[placeholder*="Personen suchen"], input[placeholder*="search"], input[type="text"]');
        if (await searchInput.count() > 0) {
          await searchInput.first().fill('John Doe');
          await page.waitForTimeout(1000);
        }
        
        // Click on John Doe again
        const johnDoeElement = page.locator('text=John Doe');
        if (await johnDoeElement.count() > 0) {
          await johnDoeElement.first().click();
          await page.waitForTimeout(1000);
        }
      } else {
        console.log(`❌ No delete buttons found for assignment ${i + 1}`);
        // Take a screenshot to see what's available
        await page.screenshot({ path: `test-results/no-delete-button-${i + 1}.png` });
        break;
      }
    }

    // 10. Wait for UI to update
    await page.waitForTimeout(3000);
    
    // 11. Verify all assignments are removed
    const remainingAssignments = await page.locator('text=/\\d+ Zuordnungen/').textContent();
    const finalCount = parseInt(remainingAssignments?.match(/\d+/)?.[0] || '0');
    
    console.log(`📊 Final assignment count: ${finalCount}`);
    
    if (finalCount === 0) {
      console.log('✅ All John Doe assignments have been successfully removed!');
    } else {
      console.log(`⚠️  John Doe still has ${finalCount} assignment(s)`);
    }

    // 12. Take a screenshot after removal
    await page.screenshot({ path: 'test-results/john-doe-after-removal.png' });
    console.log('📸 Screenshot saved: test-results/john-doe-after-removal.png');

    // 13. Verify the result
    expect(finalCount).toBe(0);
    console.log('🎉 Test completed successfully!');
  });
});
