import { test, expect } from '@playwright/test';

test.describe('Remove John Doe Assignments via API', () => {
  test('should remove all assignments for John Doe via API calls', async ({ page }) => {
    console.log('🧪 Starting John Doe assignment removal via API...');
    
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

    // 4. Search for John Doe
    const searchInput = page.locator('input[placeholder*="Personen suchen"], input[placeholder*="search"], input[type="text"]');
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('John Doe');
      console.log('✅ Searched for John Doe');
      
      // Wait a moment for search results
      await page.waitForTimeout(2000);
    }

    // 5. Click on John Doe
    const johnDoeElement = page.locator('text=John Doe');
    if (await johnDoeElement.count() > 0) {
      await johnDoeElement.first().click();
      console.log('✅ Selected John Doe');
      await page.waitForTimeout(1000);
    } else {
      throw new Error('John Doe not found on the page');
    }

    // 6. Check how many assignments John Doe has
    const assignmentsText = await page.locator('text=/\\d+ Zuordnungen/').textContent();
    const assignmentCount = parseInt(assignmentsText?.match(/\d+/)?.[0] || '0');
    console.log(`📊 John Doe has ${assignmentCount} assignments`);

    // 7. Use JavaScript to make API calls to remove assignments
    const result = await page.evaluate(async (count) => {
      console.log('🔧 Making API calls to remove assignments...');
      
      // Get all assignments for John Doe
      const peopleResponse = await fetch('/api/people?search=John Doe', {
        credentials: 'include'
      });
      
      if (!peopleResponse.ok) {
        throw new Error(`Failed to fetch people: ${peopleResponse.status}`);
      }
      
      const peopleData = await peopleResponse.json();
      const johnDoe = peopleData.people.find(p => p.firstName === 'John' && p.lastName === 'Doe');
      
      if (!johnDoe) {
        throw new Error('John Doe not found in API response');
      }
      
      console.log('✅ Found John Doe in API:', johnDoe.id);
      console.log('Property roles:', johnDoe.propertyRoles.length);
      console.log('Unit roles:', johnDoe.unitRoles.length);
      
      let removedCount = 0;
      
      // Remove property assignments
      for (const propertyRole of johnDoe.propertyRoles) {
        try {
          console.log(`🗑️  Removing property assignment: ${propertyRole.property.name} (${propertyRole.role})`);
          
          const deleteResponse = await fetch(`/api/properties/${propertyRole.property.id}/people?personId=${johnDoe.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (deleteResponse.ok) {
            console.log(`✅ Removed property assignment: ${propertyRole.property.name}`);
            removedCount++;
          } else {
            console.log(`❌ Failed to remove property assignment: ${propertyRole.property.name} - ${deleteResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Error removing property assignment: ${error.message}`);
        }
      }
      
      // Remove unit assignments
      for (const unitRole of johnDoe.unitRoles) {
        try {
          console.log(`🗑️  Removing unit assignment: ${unitRole.unit.name} (${unitRole.role})`);
          
          const deleteResponse = await fetch(`/api/units/${unitRole.unit.id}/people?personId=${johnDoe.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          
          if (deleteResponse.ok) {
            console.log(`✅ Removed unit assignment: ${unitRole.unit.name}`);
            removedCount++;
          } else {
            console.log(`❌ Failed to remove unit assignment: ${unitRole.unit.name} - ${deleteResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Error removing unit assignment: ${error.message}`);
        }
      }
      
      return { removedCount, totalCount: johnDoe.propertyRoles.length + johnDoe.unitRoles.length };
    }, assignmentCount);
    
    console.log(`📊 API removal result: ${result.removedCount}/${result.totalCount} assignments removed`);
    
    // 8. Wait for UI to update
    await page.waitForTimeout(3000);
    
    // 9. Refresh the page to see the changes
    await page.reload();
    await page.waitForTimeout(2000);
    
    // 10. Search for John Doe again
    const searchInput2 = page.locator('input[placeholder*="Personen suchen"], input[placeholder*="search"], input[type="text"]');
    if (await searchInput2.count() > 0) {
      await searchInput2.first().fill('John Doe');
      await page.waitForTimeout(1000);
    }
    
    // 11. Click on John Doe again
    const johnDoeElement2 = page.locator('text=John Doe');
    if (await johnDoeElement2.count() > 0) {
      await johnDoeElement2.first().click();
      await page.waitForTimeout(1000);
    }
    
    // 12. Check final assignment count
    const finalAssignmentsText = await page.locator('text=/\\d+ Zuordnungen/').textContent();
    const finalCount = parseInt(finalAssignmentsText?.match(/\d+/)?.[0] || '0');
    
    console.log(`📊 Final assignment count: ${finalCount}`);
    
    if (finalCount === 0) {
      console.log('✅ All John Doe assignments have been successfully removed!');
    } else {
      console.log(`⚠️  John Doe still has ${finalCount} assignment(s)`);
    }

    // 13. Take a screenshot after removal
    await page.screenshot({ path: 'test-results/john-doe-after-api-removal.png' });
    console.log('📸 Screenshot saved: test-results/john-doe-after-api-removal.png');

    // 14. Verify the result
    expect(finalCount).toBe(0);
    console.log('🎉 Test completed successfully!');
  });
});
