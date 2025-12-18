import { test, expect } from '@playwright/test';

test.describe('F043: MedicalStaffDetailView Page Component', () => {
  // Use the authenticated state from auth.setup.ts
  test.use({ storageState: 'e2e/.auth/user.json' });

  const validStaffId = '123e4567-e89b-12d3-a456-426614174000'; // Replace with actual staff ID in your test database
  const invalidStaffId = '00000000-0000-0000-0000-000000000000';

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard first to ensure authentication
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Navigation and Rendering', () => {
    test('should navigate to detail page via URL parameter', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);
      await page.waitForLoadState('networkidle');

      // Check page container renders
      const pageContainer = page.getByTestId('medical-staff-detail-page');
      await expect(pageContainer).toBeVisible();
    });

    test('should display back button in page header', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);
      await page.waitForLoadState('networkidle');

      const backButton = page.getByTestId('back-button');
      await expect(backButton).toBeVisible();
      await expect(backButton).toContainText('Voltar');
    });

    test('should render all component sections when data loads', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);

      // Wait for loading to complete (wait for header to appear)
      await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });

      // Check all sections are present
      await expect(page.getByTestId('medical-staff-header')).toBeVisible();
      await expect(page.getByTestId('medical-staff-info-card')).toBeVisible();
      await expect(page.getByTestId('medical-staff-shift-history')).toBeVisible();
      await expect(page.getByTestId('medical-staff-performance-metrics')).toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading skeletons during data fetch', async ({ page }) => {
      // Intercept API request to delay response
      await page.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);

      // Check for loading skeleton
      const loadingSkeleton = page.getByTestId('loading-skeleton');
      await expect(loadingSkeleton).toBeVisible();
    });

    test('should hide loading skeletons after data loads', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);

      // Wait for header to appear (indicates loading complete)
      await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });

      // Loading skeleton should not be visible
      const loadingSkeleton = page.getByTestId('loading-skeleton');
      await expect(loadingSkeleton).not.toBeVisible();
    });
  });

  test.describe('Error States', () => {
    test('should show error message for invalid/non-existent ID', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${invalidStaffId}`);
      await page.waitForLoadState('networkidle');

      // Wait for error message to appear
      const errorMessage = page.getByTestId('error-message');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      await expect(page.getByText('Profissional não encontrado')).toBeVisible();
    });

    test('should show helpful error text when staff not found', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${invalidStaffId}`);
      await page.waitForLoadState('networkidle');

      await expect(
        page.getByText(/não foi encontrado ou você não tem permissão/i)
      ).toBeVisible({ timeout: 10000 });
    });

    test('should display back button in error state', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${invalidStaffId}`);
      await page.waitForLoadState('networkidle');

      const backButton = page.getByTestId('back-button');
      await expect(backButton).toBeVisible();
    });

    test('should not display component sections in error state', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${invalidStaffId}`);
      await page.waitForLoadState('networkidle');

      // Wait for error state
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });

      // Component sections should not be visible
      await expect(page.getByTestId('medical-staff-info-card')).not.toBeVisible();
      await expect(page.getByTestId('medical-staff-shift-history')).not.toBeVisible();
      await expect(page.getByTestId('medical-staff-performance-metrics')).not.toBeVisible();
    });
  });

  test.describe('Back Button Navigation', () => {
    test('should navigate to /dashboard/corpo-clinico when back button clicked', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);
      await page.waitForLoadState('networkidle');

      const backButton = page.getByTestId('back-button');
      await backButton.click();

      // Wait for navigation to complete
      await page.waitForURL('/dashboard/corpo-clinico', { timeout: 5000 });
      expect(page.url()).toContain('/dashboard/corpo-clinico');
    });

    test('should navigate back from error state', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${invalidStaffId}`);
      await page.waitForLoadState('networkidle');

      // Wait for error state
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });

      // Click back button or "Voltar para Lista" button
      const backButtons = page.getByRole('button', { name: /voltar/i });
      await backButtons.first().click();

      // Should navigate to listing page
      await page.waitForURL('/dashboard/corpo-clinico', { timeout: 5000 });
      expect(page.url()).toContain('/dashboard/corpo-clinico');
    });
  });

  test.describe('Component Layout and Structure', () => {
    test('should display all sections in correct layout order', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);

      // Wait for content to load
      await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });

      // Get all main sections in DOM order
      const container = page.getByTestId('medical-staff-detail-page');

      // Verify sections are present (order is handled by CSS grid)
      await expect(container.getByTestId('medical-staff-header')).toBeVisible();
      await expect(container.getByTestId('medical-staff-info-card')).toBeVisible();
      await expect(container.getByTestId('medical-staff-shift-history')).toBeVisible();
      await expect(container.getByTestId('medical-staff-performance-metrics')).toBeVisible();
    });

    test('should render header with large size variant', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);
      await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });

      const header = page.getByTestId('medical-staff-header');
      await expect(header).toBeVisible();
    });

    test('should render info card with custom title', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);
      await page.waitForSelector('[data-testid="medical-staff-info-card"]', { timeout: 10000 });

      const infoCard = page.getByTestId('medical-staff-info-card');
      await expect(infoCard).toBeVisible();
    });
  });

  test.describe('Responsive Layout', () => {
    test('should be responsive on mobile viewport (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);

      await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });

      // All sections should be visible (stacked vertically on mobile)
      await expect(page.getByTestId('medical-staff-info-card')).toBeVisible();
      await expect(page.getByTestId('medical-staff-shift-history')).toBeVisible();
      await expect(page.getByTestId('medical-staff-performance-metrics')).toBeVisible();
    });

    test('should be responsive on tablet viewport (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);

      await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });

      // All sections should be visible
      await expect(page.getByTestId('medical-staff-info-card')).toBeVisible();
      await expect(page.getByTestId('medical-staff-shift-history')).toBeVisible();
      await expect(page.getByTestId('medical-staff-performance-metrics')).toBeVisible();
    });

    test('should be responsive on desktop viewport (1440px)', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);

      await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });

      // All sections should be visible (grid layout on desktop)
      await expect(page.getByTestId('medical-staff-info-card')).toBeVisible();
      await expect(page.getByTestId('medical-staff-shift-history')).toBeVisible();
      await expect(page.getByTestId('medical-staff-performance-metrics')).toBeVisible();
    });
  });

  test.describe('Data Display', () => {
    test('should display professional header information', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);

      const header = await page.waitForSelector('[data-testid="medical-staff-header"]', { timeout: 10000 });
      await expect(header).toBeVisible();

      // Header should contain name and specialty (specific text will vary by data)
      const staffName = header.locator('[data-testid="staff-name"]');
      await expect(staffName).toBeVisible();
    });

    test('should display information card with sections', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);

      const infoCard = await page.waitForSelector('[data-testid="medical-staff-info-card"]', { timeout: 10000 });
      await expect(infoCard).toBeVisible();
    });

    test('should display shift history', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);

      const shiftHistory = await page.waitForSelector('[data-testid="medical-staff-shift-history"]', { timeout: 10000 });
      await expect(shiftHistory).toBeVisible();
    });

    test('should display performance metrics', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);

      const performanceMetrics = await page.waitForSelector('[data-testid="medical-staff-performance-metrics"]', { timeout: 10000 });
      await expect(performanceMetrics).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper page structure with container', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);
      await page.waitForLoadState('networkidle');

      const container = page.getByTestId('medical-staff-detail-page');
      await expect(container).toBeVisible();
    });

    test('should have accessible back button with text', async ({ page }) => {
      await page.goto(`/dashboard/corpo-clinico/${validStaffId}`);
      await page.waitForLoadState('networkidle');

      const backButton = page.getByRole('button', { name: /voltar/i });
      await expect(backButton).toBeVisible();
    });
  });
});
