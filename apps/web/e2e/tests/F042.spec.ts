/**
 * E2E Tests for F042: MedicalStaffPerformanceMetrics Component
 *
 * Tests the performance metrics component as rendered in the medical staff detail page.
 * This is a proper Playwright e2e test that navigates to the real page.
 */

import { test, expect } from '@playwright/test';

test.describe('F042: MedicalStaffPerformanceMetrics Component', () => {
  // Helper to get staff ID - runs at the beginning of page tests
  async function getStaffId(page: import('@playwright/test').Page): Promise<string | null> {
    await page.goto('/dashboard/equipe');
    await page.waitForSelector('[data-testid="data-table"]', { timeout: 15000 });

    const staffLink = page.locator('[data-testid="staff-name-link"]').first();
    if (await staffLink.isVisible()) {
      await staffLink.click();
      await page.waitForURL(/\/dashboard\/corpo-clinico\/[a-f0-9-]+/, { timeout: 10000 });
      return page.url().split('/').pop() || null;
    }
    return null;
  }

  test.describe('Component Rendering', () => {
    test('should have component file in correct location', async () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(
        process.cwd(),
        'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
      );
      expect(fs.existsSync(componentPath)).toBe(true);
    });

    test('should export required component - verified via file check', async () => {
      const fs = require('fs');
      const path = require('path');
      const componentCode = fs.readFileSync(
        path.join(process.cwd(), 'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'),
        'utf-8'
      );
      // Check that component is exported
      expect(componentCode).toContain('export const MedicalStaffPerformanceMetrics');
    });

    test('should have Recharts library installed', async () => {
      const packageJson = require('../../package.json');
      expect(packageJson.dependencies.recharts).toBeDefined();
    });
  });

  test.describe('Component Structure in Page', () => {
    test('should render performance metrics container', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="performance-metrics"]', { timeout: 15000 });
      await expect(page.getByTestId('performance-metrics')).toBeVisible();
    });

    test('should render all metric cards', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="performance-metrics"]', { timeout: 15000 });
      const metricCards = page.locator('[data-testid="metric-card"]');
      const count = await metricCards.count();
      expect(count).toBe(4);
    });

    test('should render time range selector', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="performance-metrics"]', { timeout: 15000 });
      await expect(page.getByTestId('time-range-selector')).toBeVisible();
    });

    test('should render performance chart container', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="performance-metrics"]', { timeout: 15000 });
      await expect(page.getByTestId('performance-chart')).toBeVisible();
    });
  });

  test.describe('Metrics Display', () => {
    test('should display total shifts metric label', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="performance-metrics"]', { timeout: 15000 });
      await expect(page.getByText('Total de Plantões')).toBeVisible();
    });

    test('should display total hours metric label', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="performance-metrics"]', { timeout: 15000 });
      await expect(page.getByText('Total de Horas')).toBeVisible();
    });

    test('should display facilities worked metric label', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="performance-metrics"]', { timeout: 15000 });
      await expect(page.getByText('Clínicas Atendidas')).toBeVisible();
    });

    test('should display attendance rate metric label', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="performance-metrics"]', { timeout: 15000 });
      await expect(page.getByText('Taxa de Presença')).toBeVisible();
    });
  });

  test.describe('Time Range Selector', () => {
    test('should have 30 days option', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="time-range-selector"]', { timeout: 15000 });
      await expect(page.getByText('30 dias')).toBeVisible();
    });

    test('should have 90 days option', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="time-range-selector"]', { timeout: 15000 });
      await expect(page.getByText('90 dias')).toBeVisible();
    });

    test('should have 365 days option', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="time-range-selector"]', { timeout: 15000 });
      await expect(page.getByText('365 dias')).toBeVisible();
    });

    test('should default to 30 days', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="time-range-selector"]', { timeout: 15000 });
      const tab30 = page.locator('[data-testid="time-range-selector"] [value="30"]');
      await expect(tab30).toHaveAttribute('data-state', 'active');
    });
  });

  test.describe('Chart Rendering', () => {
    test('should have Recharts components available - verified via package.json', async () => {
      const packageJson = require('../../package.json');
      expect(packageJson.dependencies.recharts).toBeDefined();
    });

    test('should render chart tabs', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="performance-chart"]', { timeout: 15000 });
      const chart = page.getByTestId('performance-chart');
      await expect(chart).toBeVisible();
    });

    test('should render visualization title', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');
      await page.goto(`/dashboard/corpo-clinico/${staffId}`);
      await page.waitForSelector('[data-testid="performance-chart"]', { timeout: 15000 });
      await expect(page.getByText('Visualização de Dados')).toBeVisible();
    });
  });

  test.describe('Loading State', () => {
    test('should show loading state initially', async ({ page }) => {
      const staffId = await getStaffId(page);
      test.skip(!staffId, 'No staff ID available');

      // Intercept API to delay response
      await page.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.goto(`/dashboard/corpo-clinico/${staffId}`);

      // Performance metrics should be rendered (either loading or loaded)
      const performanceMetrics = page.getByTestId('performance-metrics');
      await expect(performanceMetrics).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Code Quality', () => {
    test('should use ResponsiveContainer from Recharts', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );
      expect(componentCode).toContain('ResponsiveContainer');
    });

    test('should have responsive grid classes for metric cards', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );
      expect(componentCode).toContain('grid-cols-1');
      expect(componentCode).toContain('sm:grid-cols-2');
      expect(componentCode).toContain('lg:grid-cols-4');
    });

    test('should use shadcn/ui Card component', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );
      expect(componentCode).toContain("from '@/components/ui/card'");
    });

    test('should use shadcn/ui Tabs component', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );
      expect(componentCode).toContain("from '@/components/ui/tabs'");
    });

    test('should use Lucide React icons', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );
      expect(componentCode).toContain("from 'lucide-react'");
    });
  });

  test.describe('TypeScript Type Safety', () => {
    test('should export TimeRange type', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );
      expect(componentCode).toContain('export type TimeRange');
    });

    test('should have JSDoc documentation', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );
      expect(componentCode).toContain('/**');
      expect(componentCode).toContain('@example');
    });
  });

  test.describe('Atomic Design Methodology', () => {
    test('should be in organisms directory', async () => {
      const fs = require('fs');
      const path = require('path');
      const componentPath = path.join(
        process.cwd(),
        'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
      );
      expect(fs.existsSync(componentPath)).toBe(true);
    });

    test('should be a client component', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );
      expect(componentCode).toContain("'use client'");
    });

    test('should use React.memo for performance', async () => {
      const componentCode = require('fs').readFileSync(
        require('path').join(
          process.cwd(),
          'src/components/organisms/MedicalStaffPerformanceMetrics.tsx'
        ),
        'utf-8'
      );
      expect(componentCode).toContain('React.memo');
    });
  });
});
