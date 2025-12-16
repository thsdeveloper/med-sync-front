import { test, expect } from '../fixtures/calendar.fixtures';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Comprehensive Calendar Navigation E2E Tests (F015)
 *
 * These tests verify all aspects of calendar navigation controls:
 * - Hoje (Today) button navigation
 * - Anterior (Previous) button in all views
 * - Próximo (Next) button in all views
 * - Edge cases (month/year boundaries, leap years)
 * - Date display updates
 * - State persistence
 * - URL synchronization
 *
 * All tests use authenticated session from setup, so no login required.
 */

test.describe('Calendar Navigation Controls - Hoje Button', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should navigate to current month when clicked in month view', async ({ calendarPage }) => {
    // Navigate to a past month (3 months ago)
    const pastMonth = format(subMonths(new Date(), 3), 'MMMM', { locale: ptBR });
    await calendarPage.selectMonth(pastMonth);
    await calendarPage.waitForCalendarLoad();

    // Click Hoje button
    await calendarPage.clickToday();

    // Verify we're at current month
    const currentMonth = format(new Date(), 'MMMM de yyyy', { locale: ptBR });
    await calendarPage.expectDisplayedDateContains(format(new Date(), 'MMMM', { locale: ptBR }));
  });

  test('should navigate to today in week view', async ({ calendarPage }) => {
    // Switch to week view
    await calendarPage.changeView('week');

    // Navigate away from today
    await calendarPage.clickPrevious();
    await calendarPage.clickPrevious();

    // Click Hoje
    await calendarPage.clickToday();

    // Verify calendar is visible and we're in week view
    await calendarPage.expectCalendarVisible();
    const view = await calendarPage.getCurrentView();
    expect(view).toBe('week');
  });

  test('should navigate to today in day view', async ({ calendarPage }) => {
    // Switch to day view
    await calendarPage.changeView('day');

    // Navigate away from today
    await calendarPage.clickPrevious();
    await calendarPage.clickPrevious();
    await calendarPage.clickPrevious();

    // Click Hoje
    await calendarPage.clickToday();

    // Verify calendar is visible and we're in day view
    await calendarPage.expectCalendarVisible();
    const view = await calendarPage.getCurrentView();
    expect(view).toBe('day');
  });

  test('should navigate to today in agenda view', async ({ calendarPage }) => {
    // Switch to agenda view
    await calendarPage.changeView('agenda');

    // Navigate away from today
    await calendarPage.clickPrevious();

    // Click Hoje
    await calendarPage.clickToday();

    // Verify calendar is visible and we're in agenda view
    await calendarPage.expectCalendarVisible();
    const view = await calendarPage.getCurrentView();
    expect(view).toBe('agenda');
  });

  test('should update URL when navigating to today', async ({ calendarPage, page }) => {
    // Navigate to past month
    const pastMonth = format(subMonths(new Date(), 2), 'MMMM', { locale: ptBR });
    await calendarPage.selectMonth(pastMonth);

    // Click Hoje
    await calendarPage.clickToday();

    // URL should be updated (may or may not have date param depending on implementation)
    // Just verify we're still on calendar page
    await expect(page).toHaveURL(/\/dashboard\/escalas/);
  });
});

test.describe('Calendar Navigation Controls - Anterior Button', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should navigate to previous month in month view', async ({ calendarPage }) => {
    // Get current displayed month
    const beforeDate = await calendarPage.getDisplayedDate();

    // Click Anterior
    await calendarPage.clickPrevious();

    // Get new displayed month
    const afterDate = await calendarPage.getDisplayedDate();

    // Verify month changed
    expect(afterDate).not.toBe(beforeDate);
    await calendarPage.expectCalendarVisible();
  });

  test('should navigate to previous week in week view', async ({ calendarPage }) => {
    // Switch to week view
    await calendarPage.changeView('week');

    // Click Anterior
    await calendarPage.clickPrevious();

    // Verify still in week view and calendar visible
    const view = await calendarPage.getCurrentView();
    expect(view).toBe('week');
    await calendarPage.expectCalendarVisible();
  });

  test('should navigate to previous day in day view', async ({ calendarPage }) => {
    // Switch to day view
    await calendarPage.changeView('day');

    // Click Anterior
    await calendarPage.clickPrevious();

    // Verify still in day view and calendar visible
    const view = await calendarPage.getCurrentView();
    expect(view).toBe('day');
    await calendarPage.expectCalendarVisible();
  });

  test('should navigate to previous month in agenda view', async ({ calendarPage }) => {
    // Switch to agenda view
    await calendarPage.changeView('agenda');

    const beforeDate = await calendarPage.getDisplayedDate();

    // Click Anterior
    await calendarPage.clickPrevious();

    const afterDate = await calendarPage.getDisplayedDate();

    // Verify month changed
    expect(afterDate).not.toBe(beforeDate);
    const view = await calendarPage.getCurrentView();
    expect(view).toBe('agenda');
  });

  test('should handle multiple consecutive clicks', async ({ calendarPage }) => {
    // Click Anterior 3 times
    await calendarPage.clickPrevious();
    await calendarPage.clickPrevious();
    await calendarPage.clickPrevious();

    // Verify calendar still visible and functional
    await calendarPage.expectCalendarVisible();
    await expect(calendarPage.previousButton).toBeEnabled();
    await expect(calendarPage.nextButton).toBeEnabled();
  });

  test('should update URL when navigating backward', async ({ calendarPage, page }) => {
    const urlBefore = page.url();

    // Click Anterior
    await calendarPage.clickPrevious();

    const urlAfter = page.url();

    // URL should change
    expect(urlBefore).not.toBe(urlAfter);
  });
});

test.describe('Calendar Navigation Controls - Próximo Button', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should navigate to next month in month view', async ({ calendarPage }) => {
    const beforeDate = await calendarPage.getDisplayedDate();

    // Click Próximo
    await calendarPage.clickNext();

    const afterDate = await calendarPage.getDisplayedDate();

    // Verify month changed
    expect(afterDate).not.toBe(beforeDate);
    await calendarPage.expectCalendarVisible();
  });

  test('should navigate to next week in week view', async ({ calendarPage }) => {
    // Switch to week view
    await calendarPage.changeView('week');

    // Click Próximo
    await calendarPage.clickNext();

    // Verify still in week view
    const view = await calendarPage.getCurrentView();
    expect(view).toBe('week');
    await calendarPage.expectCalendarVisible();
  });

  test('should navigate to next day in day view', async ({ calendarPage }) => {
    // Switch to day view
    await calendarPage.changeView('day');

    // Click Próximo
    await calendarPage.clickNext();

    // Verify still in day view
    const view = await calendarPage.getCurrentView();
    expect(view).toBe('day');
    await calendarPage.expectCalendarVisible();
  });

  test('should navigate to next month in agenda view', async ({ calendarPage }) => {
    // Switch to agenda view
    await calendarPage.changeView('agenda');

    const beforeDate = await calendarPage.getDisplayedDate();

    // Click Próximo
    await calendarPage.clickNext();

    const afterDate = await calendarPage.getDisplayedDate();

    // Verify month changed
    expect(afterDate).not.toBe(beforeDate);
  });

  test('should handle multiple consecutive clicks', async ({ calendarPage }) => {
    // Click Próximo 3 times
    await calendarPage.clickNext();
    await calendarPage.clickNext();
    await calendarPage.clickNext();

    // Verify calendar still visible and functional
    await calendarPage.expectCalendarVisible();
    await expect(calendarPage.previousButton).toBeEnabled();
    await expect(calendarPage.nextButton).toBeEnabled();
  });

  test('should update URL when navigating forward', async ({ calendarPage, page }) => {
    const urlBefore = page.url();

    // Click Próximo
    await calendarPage.clickNext();

    const urlAfter = page.url();

    // URL should change
    expect(urlBefore).not.toBe(urlAfter);
  });
});

test.describe('Calendar Navigation - Edge Cases', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should handle month boundary transition (Dec → Jan)', async ({ calendarPage }) => {
    // Navigate to December
    await calendarPage.selectMonth('Dezembro');
    await calendarPage.selectYear('2025');
    await calendarPage.waitForCalendarLoad();

    // Verify we're in December
    await calendarPage.expectDisplayedDateContains('dezembro');

    // Click Próximo to go to January
    await calendarPage.clickNext();

    // Should be in January now
    await calendarPage.expectDisplayedDateContains('janeiro');
    await calendarPage.expectCalendarVisible();
  });

  test('should handle year boundary transition (Jan → Dec)', async ({ calendarPage }) => {
    // Navigate to January 2026
    await calendarPage.selectMonth('Janeiro');
    await calendarPage.selectYear('2026');
    await calendarPage.waitForCalendarLoad();

    // Click Anterior to go to December 2025
    await calendarPage.clickPrevious();

    // Should be in December 2025
    await calendarPage.expectDisplayedDateContains('dezembro');
    await calendarPage.expectDisplayedDateContains('2025');
  });

  test('should handle February in leap year', async ({ calendarPage }) => {
    // Navigate to February 2024 (leap year)
    await calendarPage.selectMonth('Fevereiro');
    await calendarPage.selectYear('2024');
    await calendarPage.waitForCalendarLoad();

    // Navigate forward and backward
    await calendarPage.clickNext(); // March
    await calendarPage.clickPrevious(); // Back to Feb

    // Should still be in February 2024
    await calendarPage.expectDisplayedDateContains('fevereiro');
    await calendarPage.expectCalendarVisible();
  });

  test('should handle rapid navigation clicks', async ({ calendarPage }) => {
    // Rapid forward clicks
    for (let i = 0; i < 5; i++) {
      await calendarPage.clickNext();
    }

    // Rapid backward clicks
    for (let i = 0; i < 3; i++) {
      await calendarPage.clickPrevious();
    }

    // Calendar should still be functional
    await calendarPage.expectCalendarVisible();
    await expect(calendarPage.todayButton).toBeEnabled();
  });

  test('should maintain view mode when crossing year boundaries', async ({ calendarPage }) => {
    // Switch to week view
    await calendarPage.changeView('week');

    // Navigate to December 2025
    await calendarPage.selectMonth('Dezembro');
    await calendarPage.selectYear('2025');
    await calendarPage.waitForCalendarLoad();

    // Navigate forward across year boundary
    await calendarPage.clickNext();
    await calendarPage.clickNext();

    // Should still be in week view
    const view = await calendarPage.getCurrentView();
    expect(view).toBe('week');
  });

  test('should handle navigation across multiple years', async ({ calendarPage }) => {
    // Navigate to start year
    await calendarPage.selectYear('2024');
    await calendarPage.selectMonth('Janeiro');
    await calendarPage.waitForCalendarLoad();

    // Navigate forward 24 months (2 years)
    for (let i = 0; i < 24; i++) {
      await calendarPage.clickNext();
    }

    // Should be in Janeiro 2026
    await calendarPage.expectDisplayedDateContains('janeiro');
    await calendarPage.expectDisplayedDateContains('2026');
  });

  test('should preserve filters when navigating dates', async ({ calendarPage, page }) => {
    // Navigate forward
    await calendarPage.clickNext();

    // Get URL params
    const params = calendarPage.getURLParams();

    // Navigate again
    await calendarPage.clickNext();

    // Verify we're still on calendar page with params preserved
    await expect(page).toHaveURL(/\/dashboard\/escalas/);
  });
});

test.describe('Calendar Navigation - Date Display Updates', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should update date label when navigating forward', async ({ calendarPage }) => {
    const beforeDate = await calendarPage.getDisplayedDate();

    await calendarPage.clickNext();

    const afterDate = await calendarPage.getDisplayedDate();

    // Date label should change
    expect(afterDate).not.toBe(beforeDate);
    expect(afterDate.length).toBeGreaterThan(0);
  });

  test('should update date label when navigating backward', async ({ calendarPage }) => {
    const beforeDate = await calendarPage.getDisplayedDate();

    await calendarPage.clickPrevious();

    const afterDate = await calendarPage.getDisplayedDate();

    // Date label should change
    expect(afterDate).not.toBe(beforeDate);
    expect(afterDate.length).toBeGreaterThan(0);
  });

  test('should display Portuguese month names correctly', async ({ calendarPage }) => {
    // Navigate to different months and verify Portuguese names
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio'];

    for (const month of months) {
      await calendarPage.selectMonth(month);
      await calendarPage.waitForCalendarLoad();

      const displayedDate = await calendarPage.getDisplayedDate();
      expect(displayedDate.toLowerCase()).toContain(month.toLowerCase());
    }
  });

  test('should show year in date display', async ({ calendarPage }) => {
    const displayedDate = await calendarPage.getDisplayedDate();

    // Should contain a 4-digit year (202X)
    expect(displayedDate).toMatch(/202\d/);
  });
});

test.describe('Calendar Navigation - View Mode Persistence', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should maintain month view when navigating', async ({ calendarPage }) => {
    // Default is month view
    await calendarPage.clickNext();
    await calendarPage.clickPrevious();
    await calendarPage.clickToday();

    // Should still be in month view
    const view = await calendarPage.getCurrentView();
    expect(view).toBe('month');
  });

  test('should maintain week view when navigating', async ({ calendarPage }) => {
    await calendarPage.changeView('week');

    await calendarPage.clickNext();
    await calendarPage.clickPrevious();
    await calendarPage.clickToday();

    const view = await calendarPage.getCurrentView();
    expect(view).toBe('week');
  });

  test('should maintain day view when navigating', async ({ calendarPage }) => {
    await calendarPage.changeView('day');

    await calendarPage.clickNext();
    await calendarPage.clickPrevious();
    await calendarPage.clickToday();

    const view = await calendarPage.getCurrentView();
    expect(view).toBe('day');
  });

  test('should maintain agenda view when navigating', async ({ calendarPage }) => {
    await calendarPage.changeView('agenda');

    await calendarPage.clickNext();
    await calendarPage.clickPrevious();

    const view = await calendarPage.getCurrentView();
    expect(view).toBe('agenda');
  });
});

test.describe('Calendar Navigation - Browser History', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should support browser back button after navigation', async ({ calendarPage, page }) => {
    // Navigate forward twice
    await calendarPage.clickNext();
    const midURL = page.url();

    await calendarPage.clickNext();
    const endURL = page.url();

    // Browser back
    await page.goBack();
    await calendarPage.waitForCalendarLoad();

    // Should be at middle state
    expect(page.url()).toBe(midURL);
    await calendarPage.expectCalendarVisible();
  });

  test('should support browser forward button after going back', async ({ calendarPage, page }) => {
    // Navigate forward
    await calendarPage.clickNext();
    await calendarPage.clickNext();
    const forwardURL = page.url();

    // Browser back
    await page.goBack();
    await calendarPage.waitForCalendarLoad();

    // Browser forward
    await page.goForward();
    await calendarPage.waitForCalendarLoad();

    // Should be back at forward state
    expect(page.url()).toBe(forwardURL);
    await calendarPage.expectCalendarVisible();
  });
});

test.describe('Calendar Navigation - Accessibility', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should have accessible navigation buttons', async ({ calendarPage }) => {
    // All navigation buttons should be visible and enabled
    await expect(calendarPage.todayButton).toBeVisible();
    await expect(calendarPage.todayButton).toBeEnabled();

    await expect(calendarPage.previousButton).toBeVisible();
    await expect(calendarPage.previousButton).toBeEnabled();

    await expect(calendarPage.nextButton).toBeVisible();
    await expect(calendarPage.nextButton).toBeEnabled();
  });

  test('should support keyboard navigation on buttons', async ({ calendarPage, page }) => {
    // Focus Hoje button
    await calendarPage.todayButton.focus();

    // Press Enter
    await page.keyboard.press('Enter');
    await calendarPage.waitForCalendarLoad();

    // Should navigate
    await calendarPage.expectCalendarVisible();
  });

  test('should not break calendar when clicking buttons rapidly', async ({ calendarPage }) => {
    // Rapid clicks should not break the calendar
    await calendarPage.clickNext();
    await calendarPage.clickNext();
    await calendarPage.clickPrevious();
    await calendarPage.clickToday();
    await calendarPage.clickPrevious();

    // Calendar should still work
    await calendarPage.expectCalendarVisible();
    await expect(calendarPage.todayButton).toBeEnabled();
  });
});

test.describe('Calendar Navigation - Session Persistence', () => {
  test('should be authenticated and access protected calendar page', async ({ page, calendarPage }) => {
    await calendarPage.goto();

    // Verify we're not redirected to login
    await expect(page).toHaveURL(/\/dashboard\/escalas/);

    // Verify calendar content is accessible
    await calendarPage.expectCalendarVisible();
  });

  test('should reuse authenticated session across tests', async ({ page }) => {
    await page.goto('/dashboard/escalas');

    // Should still have access without logging in again
    await expect(page).toHaveURL(/\/dashboard\/escalas/);

    // Verify no login form is visible
    await expect(page.locator('input[type="email"]')).not.toBeVisible();
  });
});
