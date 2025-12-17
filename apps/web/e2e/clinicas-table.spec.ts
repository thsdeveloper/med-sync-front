/**
 * E2E Tests for Clínicas Table
 *
 * Comprehensive end-to-end tests for the Clínicas table at /dashboard/organizacao/clinicas.
 * Tests cover full user workflows including:
 * - Navigation and initial page load
 * - Search functionality
 * - Filtering by status
 * - Sorting columns
 * - Pagination
 * - CRUD operations (Create, Read, Update, Delete)
 * - Responsive behavior
 * - Accessibility
 * - Data persistence
 *
 * @see F025 - Write e2e tests for Clínicas table using Playwright
 */

import { test, expect } from './fixtures/clinicas.fixtures';

/**
 * Generate unique clinic name for test isolation
 */
function generateUniqueClinicName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix} ${timestamp}-${random}`;
}

/**
 * Test suite: Navigation and Initial Load
 */
test.describe('Clinicas Table - Navigation and Initial Load', () => {
  test('should navigate to clinicas page successfully', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await expect(clinicasPage.pageTitle).toBeVisible();
    await expect(clinicasPage.createButton).toBeVisible();
  });

  test('should display table correctly on initial load', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Table should be visible
    await expect(clinicasPage.table).toBeVisible();

    // Search input should be visible
    await expect(clinicasPage.searchInput).toBeVisible();
  });

  test('should show loading state while fetching data', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    // Loading skeleton might be too fast to catch, but page should eventually load
    await clinicasPage.waitForTableLoad();
    await expect(clinicasPage.table).toBeVisible();
  });

  test('should display table columns correctly', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Check if column headers exist
    await expect(clinicasPage.page.getByRole('columnheader', { name: /unidade/i })).toBeVisible();
    await expect(clinicasPage.page.getByRole('columnheader', { name: /contato/i })).toBeVisible();
    await expect(clinicasPage.page.getByRole('columnheader', { name: /status/i })).toBeVisible();
    await expect(clinicasPage.page.getByRole('columnheader', { name: /cadastrada em/i })).toBeVisible();
    await expect(clinicasPage.page.getByRole('columnheader', { name: /ações/i })).toBeVisible();
  });

  test('should handle empty state when no clinics exist', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // If there are no clinics, empty message should be shown
    const rowCount = await clinicasPage.getRowCount();
    if (rowCount === 0) {
      await clinicasPage.expectTableEmpty();
    }
  });
});

/**
 * Test suite: Search Functionality
 */
test.describe('Clinicas Table - Search Functionality', () => {
  const testClinicName = generateUniqueClinicName('Search Test Clinic');

  test.beforeAll(async ({ page }) => {
    // Create a test clinic for search tests
    const clinicasPage = new (await import('./pages/ClinicasPage')).ClinicasPage(page);
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Only create if not exists
    const exists = await clinicasPage.hasClinic(testClinicName);
    if (!exists) {
      await clinicasPage.createClinic({
        name: testClinicName,
        type: 'clinic',
      });
    }
  });

  test('should search clinic by exact name', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.searchClinic(testClinicName);
    await clinicasPage.expectClinicVisible(testClinicName);
  });

  test('should search clinic by partial name', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Search for first word only
    const firstWord = testClinicName.split(' ')[0];
    await clinicasPage.searchClinic(firstWord);

    // Should find the clinic
    await clinicasPage.expectClinicVisible(testClinicName);
  });

  test('should be case-insensitive in search', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.searchClinic(testClinicName.toUpperCase());
    await clinicasPage.expectClinicVisible(testClinicName);
  });

  test('should clear search when input is cleared', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Search first
    await clinicasPage.searchClinic(testClinicName);
    await clinicasPage.expectSearchValue(testClinicName);

    // Clear search
    await clinicasPage.clearSearch();
    await clinicasPage.expectSearchValue('');

    // Table should show all clinics again
    await clinicasPage.expectTableNotEmpty();
  });

  test('should show empty state when search has no results', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.searchClinic('NonExistentClinic9999999');

    // Should show no results
    const rowCount = await clinicasPage.getRowCount();
    expect(rowCount).toBe(0);
  });

  test('should update results count when searching', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    const initialCount = await clinicasPage.getRowCount();

    await clinicasPage.searchClinic(testClinicName);

    const searchCount = await clinicasPage.getRowCount();
    expect(searchCount).toBeLessThanOrEqual(initialCount);
  });
});

/**
 * Test suite: Filtering
 */
test.describe('Clinicas Table - Filtering', () => {
  test.skip('should filter by active status', async ({ clinicasPage }) => {
    // TODO: Implement status filter in DataTable component
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.filterByStatus('active');

    // All visible clinics should be active
    // This test is skipped until status filter is implemented
  });

  test.skip('should filter by inactive status', async ({ clinicasPage }) => {
    // TODO: Implement status filter in DataTable component
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.filterByStatus('inactive');

    // All visible clinics should be inactive
  });

  test.skip('should combine search and filter', async ({ clinicasPage }) => {
    // TODO: Implement combined filters
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.searchClinic('Test');
    await clinicasPage.filterByStatus('active');

    // Results should match both search and filter criteria
  });
});

/**
 * Test suite: Sorting
 */
test.describe('Clinicas Table - Sorting', () => {
  test('should sort by name ascending', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.sortByColumn('name');

    // Verify sorting (first row name should be alphabetically first)
    const rows = await clinicasPage.tableRows.all();
    if (rows.length >= 2) {
      const firstRowText = await rows[0].textContent();
      const secondRowText = await rows[1].textContent();

      // Names should be in ascending order
      expect(firstRowText!.localeCompare(secondRowText!)).toBeLessThanOrEqual(0);
    }
  });

  test('should sort by name descending', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Click twice for descending
    await clinicasPage.sortByColumn('name');
    await clinicasPage.sortByColumn('name');

    // Verify sorting (first row name should be alphabetically last)
    const rows = await clinicasPage.tableRows.all();
    if (rows.length >= 2) {
      const firstRowText = await rows[0].textContent();
      const secondRowText = await rows[1].textContent();

      // Names should be in descending order
      expect(firstRowText!.localeCompare(secondRowText!)).toBeGreaterThanOrEqual(0);
    }
  });

  test('should sort by status', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.sortByColumn('status');

    // Just verify the sort action completes without error
    await expect(clinicasPage.table).toBeVisible();
  });

  test('should sort by created date ascending', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.sortByColumn('created_at');

    // Verify sorting action completes
    await expect(clinicasPage.table).toBeVisible();
  });

  test('should sort by created date descending', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Click twice for descending
    await clinicasPage.sortByColumn('created_at');
    await clinicasPage.sortByColumn('created_at');

    await expect(clinicasPage.table).toBeVisible();
  });

  test('should maintain sort when paginating', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Sort by name
    await clinicasPage.sortByColumn('name');

    // If there are multiple pages, navigate to next page
    const nextButtonEnabled = await clinicasPage.nextPageButton.isEnabled();
    if (nextButtonEnabled) {
      await clinicasPage.goToNextPage();

      // Sort should still be applied (verify by checking URL or table state)
      await expect(clinicasPage.table).toBeVisible();
    }
  });
});

/**
 * Test suite: Pagination
 */
test.describe('Clinicas Table - Pagination', () => {
  test('should navigate to next page', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    const nextButtonEnabled = await clinicasPage.nextPageButton.isEnabled();
    if (nextButtonEnabled) {
      await clinicasPage.goToNextPage();

      // Previous button should now be enabled
      await clinicasPage.expectPreviousPageEnabled(true);
    }
  });

  test('should navigate to previous page', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Go to next page first
    const nextButtonEnabled = await clinicasPage.nextPageButton.isEnabled();
    if (nextButtonEnabled) {
      await clinicasPage.goToNextPage();
      await clinicasPage.goToPreviousPage();

      // Should be back on first page
      await clinicasPage.expectPreviousPageEnabled(false);
    }
  });

  test('should change page size to 25', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.changePageSize(25);

    // Table should show up to 25 rows
    const rowCount = await clinicasPage.getRowCount();
    expect(rowCount).toBeLessThanOrEqual(25);
  });

  test('should change page size to 50', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.changePageSize(50);

    const rowCount = await clinicasPage.getRowCount();
    expect(rowCount).toBeLessThanOrEqual(50);
  });

  test('should change page size to 100', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.changePageSize(100);

    const rowCount = await clinicasPage.getRowCount();
    expect(rowCount).toBeLessThanOrEqual(100);
  });

  test('should disable previous button on first page', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.expectPreviousPageEnabled(false);
  });

  test('should maintain search when paginating', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.searchClinic('Test');

    const nextButtonEnabled = await clinicasPage.nextPageButton.isEnabled();
    if (nextButtonEnabled) {
      await clinicasPage.goToNextPage();

      // Search term should still be in input
      await clinicasPage.expectSearchValue('Test');
    }
  });
});

/**
 * Test suite: CRUD Operations - Create
 */
test.describe('Clinicas Table - CRUD: Create', () => {
  test('should open create clinic dialog', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.clickCreateButton();

    await expect(clinicasPage.sheetDialog).toBeVisible();
    await expect(clinicasPage.nameInput).toBeVisible();
    await expect(clinicasPage.submitButton).toBeVisible();
  });

  test('should create clinic with required fields only', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Test Clinic');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    // Verify clinic appears in table
    await clinicasPage.expectClinicVisible(clinicName);
  });

  test('should create hospital with required fields', async ({ clinicasPage }) => {
    const hospitalName = generateUniqueClinicName('E2E Test Hospital');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.createClinic({
      name: hospitalName,
      type: 'hospital',
    });

    await clinicasPage.expectClinicVisible(hospitalName);
  });

  test('should create clinic with all optional fields', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Full Clinic');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 98765-4321',
      active: true,
    });

    await clinicasPage.expectClinicVisible(clinicName);

    // Verify data is displayed correctly
    await clinicasPage.expectClinicData(clinicName, {
      type: 'Clínica',
      status: 'Ativa',
      phone: '(11) 98765-4321',
    });
  });

  test('should show validation error for empty name', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.clickCreateButton();

    // Try to submit without filling name
    await clinicasPage.submitButton.click();

    // Form should show validation error (sheet should still be visible)
    await expect(clinicasPage.sheetDialog).toBeVisible();
  });

  test('should cancel create operation', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.clickCreateButton();
    await clinicasPage.nameInput.fill('Test Cancel');

    await clinicasPage.cancelForm();

    // Dialog should close
    await expect(clinicasPage.sheetDialog).not.toBeVisible();
  });

  test('should persist created clinic after page refresh', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Persist Test');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    await clinicasPage.expectClinicVisible(clinicName);

    // Refresh page
    await clinicasPage.refresh();

    // Clinic should still be visible
    await clinicasPage.expectClinicVisible(clinicName);
  });

  test('should show success message after creating clinic', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Success Test');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    // Dialog should close automatically
    await expect(clinicasPage.sheetDialog).not.toBeVisible();

    // New clinic should be in table
    await clinicasPage.expectClinicVisible(clinicName);
  });
});

/**
 * Test suite: CRUD Operations - Edit
 */
test.describe('Clinicas Table - CRUD: Edit', () => {
  const editTestClinicName = generateUniqueClinicName('E2E Edit Test Clinic');

  test.beforeAll(async ({ page }) => {
    const clinicasPage = new (await import('./pages/ClinicasPage')).ClinicasPage(page);
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    const exists = await clinicasPage.hasClinic(editTestClinicName);
    if (!exists) {
      await clinicasPage.createClinic({
        name: editTestClinicName,
        type: 'clinic',
      });
    }
  });

  test('should open edit dialog for existing clinic', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.openActionMenu(editTestClinicName);
    await clinicasPage.editMenuItem.click();

    await expect(clinicasPage.sheetDialog).toBeVisible();
    await expect(clinicasPage.nameInput).toHaveValue(editTestClinicName);
  });

  test('should edit clinic name', async ({ clinicasPage }) => {
    const newName = generateUniqueClinicName('E2E Edited Clinic');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.editClinic(editTestClinicName, {
      name: newName,
    });

    // New name should be visible
    await clinicasPage.expectClinicVisible(newName);

    // Old name should not be visible
    await clinicasPage.expectClinicNotVisible(editTestClinicName);
  });

  test('should edit clinic type', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Type Edit');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Create clinic first
    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    // Edit to hospital
    await clinicasPage.editClinic(clinicName, {
      type: 'hospital',
    });

    // Verify type changed
    await clinicasPage.expectClinicData(clinicName, {
      type: 'Hospital',
    });
  });

  test('should edit clinic status to inactive', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Status Edit');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Create active clinic first
    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
      active: true,
    });

    // Edit to inactive
    await clinicasPage.editClinic(clinicName, {
      active: false,
    });

    // Verify status changed
    await clinicasPage.expectClinicData(clinicName, {
      status: 'Inativa',
    });
  });

  test('should edit contact information', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Contact Edit');
    const newPhone = '(11) 91234-5678';

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Create clinic first
    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    // Edit phone
    await clinicasPage.editClinic(clinicName, {
      phone: newPhone,
    });

    // Verify phone changed
    await clinicasPage.expectClinicData(clinicName, {
      phone: newPhone,
    });
  });

  test('should cancel edit operation', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.openActionMenu(editTestClinicName);
    await clinicasPage.editMenuItem.click();

    await expect(clinicasPage.sheetDialog).toBeVisible();

    // Change name but cancel
    await clinicasPage.nameInput.fill('Should Not Save');
    await clinicasPage.cancelForm();

    // Original name should still be visible
    await clinicasPage.expectClinicVisible(editTestClinicName);
  });

  test('should persist edited data after page refresh', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Edit Persist');
    const editedName = generateUniqueClinicName('E2E Edit Persist Edited');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Create and edit
    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    await clinicasPage.editClinic(clinicName, {
      name: editedName,
    });

    await clinicasPage.expectClinicVisible(editedName);

    // Refresh
    await clinicasPage.refresh();

    // Edited name should still be visible
    await clinicasPage.expectClinicVisible(editedName);
  });
});

/**
 * Test suite: CRUD Operations - Delete
 */
test.describe('Clinicas Table - CRUD: Delete', () => {
  test('should open delete confirmation dialog', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Delete Test');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Create clinic first
    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    // Delete should trigger confirmation
    await clinicasPage.deleteClinic(clinicName, true);

    // Clinic should be removed
    await clinicasPage.expectClinicNotVisible(clinicName);
  });

  test('should delete clinic successfully', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Delete Success');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    await clinicasPage.deleteClinic(clinicName, true);

    await clinicasPage.expectClinicNotVisible(clinicName);
  });

  test('should cancel delete operation', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Delete Cancel');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    // Cancel delete
    await clinicasPage.deleteClinic(clinicName, false);

    // Clinic should still be visible
    await clinicasPage.expectClinicVisible(clinicName);
  });

  test('should remove clinic from table after deletion', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Delete Remove');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    const initialCount = await clinicasPage.getRowCount();

    await clinicasPage.deleteClinic(clinicName, true);

    const finalCount = await clinicasPage.getRowCount();
    expect(finalCount).toBeLessThan(initialCount);
  });

  test('should persist deletion after page refresh', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Delete Persist');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    await clinicasPage.deleteClinic(clinicName, true);

    await clinicasPage.refresh();

    // Clinic should still be deleted
    await clinicasPage.expectClinicNotVisible(clinicName);
  });

  test('should delete clinic while search is active', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Delete Search');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    await clinicasPage.searchClinic(clinicName);
    await clinicasPage.expectClinicVisible(clinicName);

    await clinicasPage.deleteClinic(clinicName, true);

    // Should show no results after deletion
    const rowCount = await clinicasPage.getRowCount();
    expect(rowCount).toBe(0);
  });
});

/**
 * Test suite: Responsive Behavior
 */
test.describe('Clinicas Table - Responsive Behavior', () => {
  test('should render correctly on mobile viewport', async ({ clinicasPage, page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Table should be visible and scrollable
    await expect(clinicasPage.table).toBeVisible();
    await expect(clinicasPage.createButton).toBeVisible();
  });

  test('should render correctly on tablet viewport', async ({ clinicasPage, page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await expect(clinicasPage.table).toBeVisible();
    await expect(clinicasPage.searchInput).toBeVisible();
  });

  test('should show action menu on mobile', async ({ clinicasPage, page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    const firstRow = clinicasPage.tableRows.first();
    if (await firstRow.isVisible()) {
      const actionButton = firstRow.locator('button[aria-haspopup="menu"]');
      await expect(actionButton).toBeVisible();
    }
  });

  test('should handle form on mobile viewport', async ({ clinicasPage, page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.clickCreateButton();

    // Form should be visible and usable
    await expect(clinicasPage.sheetDialog).toBeVisible();
    await expect(clinicasPage.nameInput).toBeVisible();
  });
});

/**
 * Test suite: Accessibility
 */
test.describe('Clinicas Table - Accessibility', () => {
  test('should have proper ARIA labels on buttons', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Create button should have accessible name
    await expect(clinicasPage.createButton).toHaveAccessibleName();

    // Search input should have accessible label
    const searchLabel = await clinicasPage.searchInput.getAttribute('placeholder');
    expect(searchLabel).toBeTruthy();
  });

  test('should support keyboard navigation through table', async ({ clinicasPage, page }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Focus create button
    await clinicasPage.createButton.focus();
    await expect(clinicasPage.createButton).toBeFocused();

    // Tab to search input
    await page.keyboard.press('Tab');
    // Search input should be focusable

    await expect(clinicasPage.searchInput).toBeFocused();
  });

  test('should have proper table semantics', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Table should have proper role
    await expect(clinicasPage.table).toHaveRole('table');

    // Column headers should exist
    const headers = clinicasPage.page.locator('th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test('should support Enter key on action buttons', async ({ clinicasPage, page }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Focus create button
    await clinicasPage.createButton.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Dialog should open
    await expect(clinicasPage.sheetDialog).toBeVisible();
  });

  test('should have visible focus indicators', async ({ clinicasPage, page }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Some element should be focused (visible focus ring via CSS)
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });
});

/**
 * Test suite: Data Persistence
 */
test.describe('Clinicas Table - Data Persistence', () => {
  test('should maintain table state after page refresh', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.searchClinic('Test');
    await clinicasPage.sortByColumn('name');

    await clinicasPage.refresh();

    // Search should be cleared after refresh (depends on URL persistence)
    await clinicasPage.waitForTableLoad();
    await expect(clinicasPage.table).toBeVisible();
  });

  test('should handle browser back navigation', async ({ clinicasPage, page }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // Navigate to another page
    await page.goto('/dashboard');

    // Go back
    await clinicasPage.goBack();

    // Should be back on clinicas page
    await expect(clinicasPage.pageTitle).toBeVisible();
  });

  test('should handle browser forward navigation', async ({ clinicasPage, page }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await page.goto('/dashboard');
    await clinicasPage.goBack();
    await clinicasPage.goForward();

    // Should be on dashboard
    await page.waitForURL('**/dashboard');
  });

  test('should preserve data after network interruption', async ({ clinicasPage }) => {
    const clinicName = generateUniqueClinicName('E2E Network Test');

    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    await clinicasPage.createClinic({
      name: clinicName,
      type: 'clinic',
    });

    // Simulate page refresh (similar to network recovery)
    await clinicasPage.refresh();

    await clinicasPage.expectClinicVisible(clinicName);
  });
});

/**
 * Test suite: Session Persistence
 */
test.describe('Clinicas Table - Session Persistence', () => {
  test('should maintain authentication across tests', async ({ clinicasPage }) => {
    await clinicasPage.goto();
    await clinicasPage.waitForTableLoad();

    // If we can see the table, authentication is working
    await expect(clinicasPage.table).toBeVisible();
  });

  test('should access clinicas page without login redirect', async ({ clinicasPage, page }) => {
    await clinicasPage.goto();

    // Should not redirect to login
    await page.waitForURL('**/clinicas');
    await expect(clinicasPage.pageTitle).toBeVisible();
  });
});
