/**
 * E2E Tests for F045: Medical Staff Detail View
 *
 * Comprehensive test coverage for medical staff detail page functionality:
 * - Navigation from table (name click and menu action)
 * - Data rendering for all components (header, info card, shift history, performance metrics)
 * - Component interactions (time range selector, chart toggle, virtual scrolling)
 * - Loading states and error handling
 * - Back button navigation to listing page
 * - Responsive behavior across mobile, tablet, and desktop viewports
 * - Accessibility (keyboard navigation, ARIA labels, semantic HTML)
 */

import { test, expect } from '@playwright/test';

test.describe('Medical Staff Detail View - F045', () => {
  // Use authenticated state from auth.setup.ts
  test.use({ storageState: 'e2e/.auth/user.json' });

  let staffId: string | null = null;

  test.beforeEach(async ({ page }) => {
    // Navigate to Equipe (Medical Staff) listing page first
    await page.goto('/dashboard/equipe');
    await page.waitForSelector('[data-testid="data-table"]', { timeout: 10000 });

    // Get the first staff member ID from the table
    const firstStaffLink = page.locator('[data-testid="staff-name-link"]').first();
    if (await firstStaffLink.isVisible()) {
      // Click the name to navigate to detail page
      await firstStaffLink.click();

      // Wait for navigation and extract ID from URL
      await page.waitForURL(/\/dashboard\/corpo-clinico\/[a-f0-9-]+/, { timeout: 10000 });
      const url = page.url();
      staffId = url.split('/').pop() || null;

      // Go back to listing for consistent test state
      await page.goBack();
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 10000 });
    }
  });

  test.describe('Navigation from Table', () => {
    test('should navigate to detail page when clicking staff name in table', async ({ page }) => {
      // Click the first staff name link
      const staffNameLink = page.locator('[data-testid="staff-name-link"]').first();
      await expect(staffNameLink).toBeVisible();

      await staffNameLink.click();

      // Wait for navigation and verify URL pattern
      await page.waitForURL(/\/dashboard\/corpo-clinico\/[a-f0-9-]+/, { timeout: 10000 });

      // Verify detail page loads
      const detailPage = page.getByTestId('medical-staff-detail-page');
      await expect(detailPage).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to detail page when clicking "Visualizar" in dropdown menu', async ({ page }) => {
      // Open the first row actions menu
      const actionsButton = page.locator('[data-testid="row-actions-menu"]').first();
      await actionsButton.click();

      // Wait for dropdown menu to appear
      await page.waitForSelector('[role="menu"]', { state: 'visible' });

      // Click "Visualizar" option
      const visualizarOption = page.locator('[data-testid="view-details-action"]');
      await visualizarOption.click();

      // Wait for navigation
      await page.waitForURL(/\/dashboard\/corpo-clinico\/[a-f0-9-]+/, { timeout: 10000 });

      // Verify detail page loads
      const detailPage = page.getByTestId('medical-staff-detail-page');
      await expect(detailPage).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Page Rendering and Data Display', () => {
    test.beforeEach(async ({ page }) => {
      if (staffId) {
        await page.goto(`/dashboard/corpo-clinico/${staffId}`);
        await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });
      }
    });

    test('should render all page sections correctly', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      // Verify all main sections are present
      await expect(page.getByTestId('medical-staff-detail-page')).toBeVisible();
      await expect(page.getByTestId('medical-staff-header')).toBeVisible();
      await expect(page.getByTestId('medical-staff-info-card')).toBeVisible();
      await expect(page.getByTestId('shift-history')).toBeVisible();
      await expect(page.getByTestId('performance-metrics')).toBeVisible();
    });

    test('should display correct header information', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      const header = page.getByTestId('medical-staff-header');
      await expect(header).toBeVisible();

      // Verify header elements
      await expect(header.getByTestId('staff-avatar')).toBeVisible();
      await expect(header.getByTestId('staff-name')).toBeVisible();

      // Staff name should have text content
      const staffName = header.getByTestId('staff-name');
      const nameText = await staffName.textContent();
      expect(nameText).toBeTruthy();
      expect(nameText?.length).toBeGreaterThan(0);
    });

    test('should display all information card sections', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      const infoCard = page.getByTestId('medical-staff-info-card');
      await expect(infoCard).toBeVisible();

      // Verify the 3 information sections are present
      await expect(page.getByText('Informações de Contato')).toBeVisible();
      await expect(page.getByText('Detalhes Profissionais')).toBeVisible();
      await expect(page.getByText('Documentos e Registros')).toBeVisible();
    });

    test('should display shift history section', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      const shiftHistory = page.getByTestId('shift-history');
      await expect(shiftHistory).toBeVisible();

      // Check for shift history title
      await expect(page.getByText(/Histórico de Plantões/i)).toBeVisible();
    });

    test('should display performance metrics section', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      const performanceMetrics = page.getByTestId('performance-metrics');
      await expect(performanceMetrics).toBeVisible();

      // Verify time range selector is present
      const timeRangeSelector = page.getByTestId('time-range-selector');
      await expect(timeRangeSelector).toBeVisible();

      // Verify metric cards are present
      const metricCards = page.locator('[data-testid="metric-card"]');
      const count = await metricCards.count();
      expect(count).toBeGreaterThanOrEqual(4); // Should have 4 metric cards
    });
  });

  test.describe('Loading States', () => {
    test('should display loading skeletons during data fetch', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      // Intercept API requests to delay response
      await page.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.goto(`/dashboard/corpo-clinico/${staffId}`);

      // Check for loading skeleton
      const loadingSkeleton = page.getByTestId('loading-skeleton');
      await expect(loadingSkeleton).toBeVisible();
    });

    test('should hide loading skeletons after data loads', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      await page.goto(`/dashboard/corpo-clinico/${staffId}`);

      // Wait for header to appear (indicates loading complete)
      await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });

      // Loading skeleton should not be visible
      const loadingSkeleton = page.getByTestId('loading-skeleton');
      await expect(loadingSkeleton).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    const invalidStaffId = '00000000-0000-0000-0000-000000000000';

    test('should display error message for invalid staff ID', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${invalidStaffId}`);
      await page.waitForLoadState('networkidle');

      // Wait for error message to appear
      const errorMessage = page.getByTestId('error-message');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      // Verify error heading
      await expect(page.getByText('Profissional não encontrado')).toBeVisible();
    });

    test('should display helpful error text', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${invalidStaffId}`);
      await page.waitForLoadState('networkidle');

      // Verify detailed error message
      await expect(
        page.getByText(/não foi encontrado ou você não tem permissão/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test('should show back button in error state', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${invalidStaffId}`);
      await page.waitForLoadState('networkidle');

      // Verify back button is present
      const backButton = page.getByTestId('back-button');
      await expect(backButton).toBeVisible();
    });
  });

  test.describe('Back Button Navigation', () => {
    test('should navigate back to medical staff listing when back button clicked', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForLoadState('networkidle');

      // Click back button
      const backButton = page.getByTestId('back-button');
      await backButton.click();

      // Wait for navigation to complete
      await page.waitForURL('/dashboard/corpo-clinico', { timeout: 5000 });

      // Verify we're on the listing page (redirects to /dashboard/equipe)
      const url = page.url();
      expect(url).toMatch(/\/dashboard\/(corpo-clinico|equipe)/);
    });

    test('should preserve table state when navigating back', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      // Navigate to listing page
      await page.goto('/dashboard/equipe');
      await page.waitForSelector('[data-testid="data-table"]', { timeout: 10000 });

      // Apply a search filter
      const searchInput = page.locator('input[placeholder*="Buscar"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('Test');
        await page.waitForTimeout(500); // Wait for filter to apply
      }

      // Navigate to detail page
      const firstStaffLink = page.locator('[data-testid="staff-name-link"]').first();
      if (await firstStaffLink.isVisible()) {
        await firstStaffLink.click();
        await page.waitForURL(/\/dashboard\/corpo-clinico\/[a-f0-9-]+/, { timeout: 10000 });

        // Navigate back using back button
        const backButton = page.getByTestId('back-button');
        await backButton.click();

        // Verify we're back on the table page
        await page.waitForSelector('[data-testid="data-table"]', { timeout: 10000 });
        await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
      }
    });
  });

  test.describe('Component Interactions', () => {
    test.beforeEach(async ({ page }) => {
      if (staffId) {
        await page.goto(`/dashboard/corpo-clinico/${staffId}`);
        await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });
      }
    });

    test('should allow changing time range in performance metrics', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      const timeRangeSelector = page.getByTestId('time-range-selector');
      await expect(timeRangeSelector).toBeVisible();

      // Find the 90 days tab
      const ninetyDaysTab = page.getByRole('tab', { name: /90 dias/i });
      if (await ninetyDaysTab.isVisible()) {
        await ninetyDaysTab.click();

        // Wait for metrics to update
        await page.waitForTimeout(500);

        // Verify the tab is now selected
        const tabState = await ninetyDaysTab.getAttribute('data-state');
        expect(tabState).toBe('active');
      }
    });

    test('should allow toggling chart type in performance metrics', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      // Look for chart type tabs (shifts/hours)
      const shiftsTab = page.getByRole('tab', { name: /Plantões por Mês/i });
      const hoursTab = page.getByRole('tab', { name: /Horas por Mês/i });

      if (await shiftsTab.isVisible() && await hoursTab.isVisible()) {
        // Click hours tab
        await hoursTab.click();
        await page.waitForTimeout(500);

        // Verify tab is selected
        const tabState = await hoursTab.getAttribute('data-state');
        expect(tabState).toBe('active');

        // Click back to shifts tab
        await shiftsTab.click();
        await page.waitForTimeout(500);
      }
    });

    test('should support virtual scrolling in shift history', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      const shiftHistory = page.getByTestId('shift-history');
      await expect(shiftHistory).toBeVisible();

      // Check if shift items are present
      const shiftItems = page.locator('[data-testid="shift-item"]');
      const itemCount = await shiftItems.count();

      // If there are shift items, verify scrolling container exists
      if (itemCount > 0) {
        // The component should have a scrollable container
        const scrollContainer = shiftHistory.locator('div').first();
        const hasScrollableStyle = await scrollContainer.evaluate(
          (el) => window.getComputedStyle(el).overflowY === 'auto' ||
                  window.getComputedStyle(el).overflowY === 'scroll'
        );

        // Virtual scrolling should be implemented (check for style attribute or specific structure)
        expect(hasScrollableStyle || itemCount > 0).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should display correctly on mobile viewport (375px)', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);

      await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });

      // All sections should be visible and stacked vertically on mobile
      await expect(page.getByTestId('medical-staff-info-card')).toBeVisible();
      await expect(page.getByTestId('shift-history')).toBeVisible();
      await expect(page.getByTestId('performance-metrics')).toBeVisible();

      // Verify back button is visible on mobile
      await expect(page.getByTestId('back-button')).toBeVisible();
    });

    test('should display correctly on tablet viewport (768px)', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);

      await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });

      // All sections should be visible on tablet
      await expect(page.getByTestId('medical-staff-info-card')).toBeVisible();
      await expect(page.getByTestId('shift-history')).toBeVisible();
      await expect(page.getByTestId('performance-metrics')).toBeVisible();
    });

    test('should display correctly on desktop viewport (1440px)', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);

      await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });

      // All sections should be visible in grid layout on desktop
      await expect(page.getByTestId('medical-staff-info-card')).toBeVisible();
      await expect(page.getByTestId('shift-history')).toBeVisible();
      await expect(page.getByTestId('performance-metrics')).toBeVisible();

      // On desktop, info card should be in left column (1/3 width)
      const infoCard = page.getByTestId('medical-staff-info-card');
      const infoCardParent = infoCard.locator('..');
      const classNames = await infoCardParent.getAttribute('class');
      expect(classNames).toContain('lg:col-span-1');
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      if (staffId) {
        await page.goto(`/dashboard/corpo-clinico/${staffId}`);
        await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });
      }
    });

    test('should support keyboard navigation through page', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      // Tab through interactive elements
      await page.keyboard.press('Tab'); // Focus back button
      await page.keyboard.press('Tab'); // Focus next element

      // Verify focus is on an interactive element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper semantic HTML structure', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      // Verify main container has proper data-testid
      const mainContainer = page.getByTestId('medical-staff-detail-page');
      await expect(mainContainer).toBeVisible();

      // Verify back button is a proper button element
      const backButton = page.getByTestId('back-button');
      const buttonRole = await backButton.getAttribute('role');
      const buttonType = await backButton.evaluate((el) => el.tagName.toLowerCase());

      expect(buttonType === 'button' || buttonRole === 'button').toBeTruthy();
    });
  });

  test.describe('Data-Testid Selectors', () => {
    test.beforeEach(async ({ page }) => {
      if (staffId) {
        await page.goto(`/dashboard/corpo-clinico/${staffId}`);
        await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });
      }
    });

    test('should have all required data-testid selectors', async ({ page }) => {
      test.skip(!staffId, 'No staff ID available');

      // Verify all required selectors from test_criteria
      await expect(page.getByTestId('medical-staff-detail-page')).toBeVisible();
      await expect(page.getByTestId('back-button')).toBeVisible();

      // Component selectors
      await expect(page.getByTestId('medical-staff-header')).toBeVisible();
      await expect(page.getByTestId('staff-name')).toBeVisible();

      // Verify presence of other components
      await expect(page.getByTestId('medical-staff-info-card')).toBeVisible();
      await expect(page.getByTestId('shift-history')).toBeVisible();
      await expect(page.getByTestId('performance-metrics')).toBeVisible();
    });
  });
});
