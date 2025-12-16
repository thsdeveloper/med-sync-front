import { test as base } from '@playwright/test';
import { CalendarPage } from '../pages/CalendarPage';

/**
 * Custom Test Fixtures for Calendar Testing
 *
 * Extends Playwright's base test with calendar-specific fixtures:
 * - calendarPage: Pre-initialized CalendarPage object
 * - authenticatedPage: Page with pre-loaded authentication state
 *
 * All tests using these fixtures will automatically:
 * 1. Use the saved authentication state
 * 2. Have access to calendar page objects
 * 3. Start with a clean browser context
 *
 * @example
 * ```typescript
 * import { test, expect } from './fixtures/calendar.fixtures';
 *
 * test('should navigate calendar', async ({ calendarPage }) => {
 *   await calendarPage.goto();
 *   await calendarPage.clickToday();
 * });
 * ```
 */

type CalendarFixtures = {
  /**
   * Calendar page object with all helper methods
   * Automatically initialized with the current page context
   */
  calendarPage: CalendarPage;
};

/**
 * Extend base Playwright test with calendar fixtures
 */
export const test = base.extend<CalendarFixtures>({
  /**
   * Calendar page fixture
   * Creates a new CalendarPage instance for each test
   */
  calendarPage: async ({ page }, use) => {
    // Initialize calendar page object
    const calendarPage = new CalendarPage(page);

    // Make it available to the test
    await use(calendarPage);

    // Cleanup (if needed) happens here after test completes
  },
});

/**
 * Re-export expect for convenience
 */
export { expect } from '@playwright/test';
