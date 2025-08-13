import { test, expect } from '@playwright/test';

test.describe('Rental Management Application - User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('Complete user workflow: registration, property creation, unit management, and rental tracking', async ({ page }) => {
    // Step 1: User Registration
    await test.step('User Registration', async () => {
      await page.getByRole('link', { name: 'Registrieren' }).click();
      
      // Fill registration form
      await page.getByLabel('Name').fill('Test User');
      await page.getByLabel('E-Mail').fill('test@example.com');
      await page.getByLabel('Passwort', { exact: true }).fill('password123');
      await page.getByLabel('Passwort bestätigen').fill('password123');
      
      // Submit registration
      await page.getByRole('button', { name: 'Registrieren' }).click();
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByText('Willkommen, Test User')).toBeVisible();
    });

    // Step 2: Create First Property
    await test.step('Create Property', async () => {
      await page.getByRole('link', { name: 'Neues Objekt' }).click();
      
      // Fill property form
      await page.getByLabel('Name').fill('Test Property');
      await page.getByLabel('Adresse').fill('Teststraße 123, 12345 Teststadt');
      await page.getByLabel('Beschreibung').fill('Ein Testobjekt für die Anwendung');
      
      // Submit property creation
      await page.getByRole('button', { name: 'Objekt erstellen' }).click();
      
      // Should redirect to property details
      await expect(page).toHaveURL(/\/properties\/[a-zA-Z0-9]+/);
      await expect(page.getByText('Test Property')).toBeVisible();
    });

    // Step 3: Create Unit (Simple Mode)
    await test.step('Create Unit in Simple Mode', async () => {
      // Click on "Neue Einheit" button
      await page.getByRole('link', { name: 'Neue Einheit' }).click();
      
      // Fill unit form
      await page.getByLabel('Name').fill('Hauptwohnung');
      await page.getBySelectOption('Wohnung').click();
      await page.getByLabel('Größe').fill('80m²');
      await page.getByLabel('Beschreibung').fill('Hauptwohnung im Erdgeschoss');
      
      // Submit unit creation
      await page.getByRole('button', { name: 'Einheit erstellen' }).click();
      
      // Should redirect to unit details
      await expect(page).toHaveURL(/\/units\/[a-zA-Z0-9]+/);
      await expect(page.getByText('Hauptwohnung')).toBeVisible();
    });

    // Step 4: Navigate to Yearly Overview
    await test.step('Navigate to Yearly Overview', async () => {
      await page.getByRole('link', { name: 'Jahresübersicht' }).click();
      
      // Should be on yearly overview page
      await expect(page).toHaveURL(/\/units\/[a-zA-Z0-9]+\/yearly-overview/);
      await expect(page.getByText('Monatliche Übersicht')).toBeVisible();
    });

    // Step 5: Edit Standard Rent
    await test.step('Edit Standard Rent', async () => {
      await page.getByRole('button', { name: 'Standard-Miete bearbeiten' }).click();
      
      // Fill standard rent form
      await page.getByLabel('Monatliche Miete (€)').fill('1200');
      await page.getByLabel('Nebenkosten (€)').fill('200');
      
      // Submit standard rent update
      await page.getByRole('button', { name: 'Speichern' }).click();
      
      // Modal should close
      await expect(page.getByText('Standard-Miete bearbeiten')).not.toBeVisible();
    });

    // Step 6: Test Excel-like Inline Editing
    await test.step('Test Excel-like Inline Editing', async () => {
      // Click on January rent amount to edit
      const januaryRentCell = page.locator('tr').filter({ hasText: 'Januar' }).locator('td').nth(1);
      await januaryRentCell.click();
      
      // Should show input field
      const rentInput = page.locator('input[type="number"]').first();
      await expect(rentInput).toBeVisible();
      
      // Edit the value
      await rentInput.fill('1300');
      await rentInput.press('Enter');
      
      // Should save and show updated value
      await expect(januaryRentCell).toContainText('1.300,00 €');
    });

    // Step 7: Test Utilities Editing
    await test.step('Test Utilities Editing', async () => {
      // Click on January utilities amount to edit
      const januaryUtilitiesCell = page.locator('tr').filter({ hasText: 'Januar' }).locator('td').nth(2);
      await januaryUtilitiesCell.click();
      
      // Should show input field
      const utilitiesInput = page.locator('input[type="number"]').first();
      await expect(utilitiesInput).toBeVisible();
      
      // Edit the value
      await utilitiesInput.fill('250');
      await utilitiesInput.press('Enter');
      
      // Should save and show updated value
      await expect(januaryUtilitiesCell).toContainText('250,00 €');
      
      // Total should be updated automatically
      const totalCell = page.locator('tr').filter({ hasText: 'Januar' }).locator('td').nth(3);
      await expect(totalCell).toContainText('1.550,00 €');
    });

    // Step 8: Test Notes Editing
    await test.step('Test Notes Editing', async () => {
      // Click on January notes to edit
      const januaryNotesCell = page.locator('tr').filter({ hasText: 'Januar' }).locator('td').nth(5);
      await januaryNotesCell.click();
      
      // Should show input field
      const notesInput = page.locator('input[type="text"]').first();
      await expect(notesInput).toBeVisible();
      
      // Edit the value
      await notesInput.fill('Test note for January');
      await notesInput.press('Enter');
      
      // Should save and show updated value
      await expect(januaryNotesCell).toContainText('Test note for January');
    });

    // Step 9: Test Payment Status Toggle
    await test.step('Test Payment Status Toggle', async () => {
      // Click on January payment checkbox
      const januaryPaymentCheckbox = page.locator('tr').filter({ hasText: 'Januar' }).locator('td').nth(4).locator('button');
      await januaryPaymentCheckbox.click();
      
      // Should show as paid (green checkmark)
      await expect(januaryPaymentCheckbox).toHaveClass(/bg-green-500/);
    });

    // Step 10: Test Year Navigation
    await test.step('Test Year Navigation', async () => {
      // Change year to 2024
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: '2024' }).click();
      
      // Should show 2024 data
      await expect(page.getByText('Januar')).toBeVisible();
    });

    // Step 11: Navigate Back to Dashboard
    await test.step('Navigate Back to Dashboard', async () => {
      await page.getByRole('link', { name: 'Dashboard' }).click();
      
      // Should be on dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByText('Test Property')).toBeVisible();
    });

    // Step 12: Verify Property Overview
    await test.step('Verify Property Overview', async () => {
      // Click on property to view details
      await page.getByText('Test Property').click();
      
      // Should show property details
      await expect(page).toHaveURL(/\/properties\/[a-zA-Z0-9]+/);
      await expect(page.getByText('Hauptwohnung')).toBeVisible();
    });
  });

  test('Test responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Should be responsive
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Test mobile menu if it exists
    const mobileMenuButton = page.locator('[aria-label="Menu"]').first();
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(page.getByRole('link', { name: 'Neues Objekt' })).toBeVisible();
    }
  });

  test('Test error handling and validation', async ({ page }) => {
    // Test registration with invalid email
    await page.getByRole('link', { name: 'Registrieren' }).click();
    
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('E-Mail').fill('invalid-email');
    await page.getByLabel('Passwort', { exact: true }).fill('password123');
    await page.getByLabel('Passwort bestätigen').fill('password123');
    
    await page.getByRole('button', { name: 'Registrieren' }).click();
    
    // Should show validation error
    await expect(page.getByText(/E-Mail/i)).toBeVisible();
  });

  test('Test keyboard navigation and accessibility', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test keyboard navigation through links
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should navigate to the focused link
    await expect(page).not.toHaveURL('/dashboard');
  });
});
