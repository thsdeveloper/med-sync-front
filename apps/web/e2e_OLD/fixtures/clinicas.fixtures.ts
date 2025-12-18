import { test as base } from '@playwright/test';
import { ClinicasPage } from '../pages/ClinicasPage';

/**
 * Custom Test Fixtures for Clinicas Testing
 *
 * Extends Playwright's base test with clinicas-specific fixtures:
 * - clinicasPage: Pre-initialized ClinicasPage object
 *
 * All tests using these fixtures will automatically:
 * 1. Use the saved authentication state
 * 2. Have access to clinicas page objects
 * 3. Start with a clean browser context
 *
 * @example
 * ```typescript
 * import { test, expect } from './fixtures/clinicas.fixtures';
 *
 * test('should create clinic', async ({ clinicasPage }) => {
 *   await clinicasPage.goto();
 *   await clinicasPage.createClinic({ name: 'Test Clinic' });
 * });
 * ```
 */

type ClinicasFixtures = {
  /**
   * Clinicas page object with all helper methods
   * Automatically initialized with the current page context
   */
  clinicasPage: ClinicasPage;
};

/**
 * Extend base Playwright test with clinicas fixtures
 */
export const test = base.extend<ClinicasFixtures>({
  /**
   * Clinicas page fixture
   * Creates a new ClinicasPage instance for each test
   */
  clinicasPage: async ({ page }, use) => {
    // Initialize clinicas page object
    const clinicasPage = new ClinicasPage(page);

    // Make it available to the test
    await use(clinicasPage);

    // Cleanup (if needed) happens here after test completes
  },
});

/**
 * Re-export expect for convenience
 */
export { expect } from '@playwright/test';
