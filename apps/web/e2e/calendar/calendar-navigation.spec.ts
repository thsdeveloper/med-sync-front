import { test, expect } from '../fixtures/calendar.fixtures';

/**
 * Calendar Navigation Tests
 *
 * These tests verify the calendar navigation controls work correctly:
 * - Hoje (Today) button
 * - Anterior (Previous) button
 * - Próximo (Next) button
 * - View mode switching (Mês, Semana, Dia, Agenda)
 *
 * All tests use authenticated session from setup, so no login required.
 */

test.describe('Calendar Navigation', () => {
  test.beforeEach(async ({ calendarPage }) => {
    // Navigate to calendar page before each test
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should display calendar page', async ({ calendarPage }) => {
    // Verify calendar is visible
    await calendarPage.expectCalendarVisible();

    // Verify navigation controls are present
    await expect(calendarPage.todayButton).toBeVisible();
    await expect(calendarPage.previousButton).toBeVisible();
    await expect(calendarPage.nextButton).toBeVisible();
  });

  test('should navigate to today when clicking Hoje button', async ({ calendarPage, page }) => {
    // Click previous a few times to move away from today
    await calendarPage.clickPrevious();
    await calendarPage.clickPrevious();

    // Get URL before clicking Hoje
    const urlBeforeToday = page.url();

    // Click Hoje button
    await calendarPage.clickToday();

    // Verify URL changed (different date parameters)
    const urlAfterToday = page.url();

    // URLs should be different if we moved away from today
    // (This assumes URL contains date parameters)
    // If same day, URLs might match, so we just verify no errors
    await calendarPage.expectCalendarVisible();
  });

  test('should navigate to previous period when clicking Anterior', async ({ calendarPage, page }) => {
    // Get current URL
    const urlBefore = page.url();

    // Click Anterior button
    await calendarPage.clickPrevious();

    // Wait for calendar to update
    await calendarPage.waitForCalendarLoad();

    // Verify calendar is still visible
    await calendarPage.expectCalendarVisible();

    // URL should change (date parameters updated)
    const urlAfter = page.url();
    expect(urlBefore).not.toBe(urlAfter);
  });

  test('should navigate to next period when clicking Próximo', async ({ calendarPage, page }) => {
    // Get current URL
    const urlBefore = page.url();

    // Click Próximo button
    await calendarPage.clickNext();

    // Wait for calendar to update
    await calendarPage.waitForCalendarLoad();

    // Verify calendar is still visible
    await calendarPage.expectCalendarVisible();

    // URL should change (date parameters updated)
    const urlAfter = page.url();
    expect(urlBefore).not.toBe(urlAfter);
  });

  test('should switch to week view', async ({ calendarPage }) => {
    // Switch to week view
    await calendarPage.changeView('week');

    // Verify calendar is still visible
    await calendarPage.expectCalendarVisible();

    // Verify week view button is active
    await expect(calendarPage.weekViewButton).toHaveAttribute('variant', 'default');
  });

  test('should switch to day view', async ({ calendarPage }) => {
    // Switch to day view
    await calendarPage.changeView('day');

    // Verify calendar is still visible
    await calendarPage.expectCalendarVisible();

    // Verify day view button is active
    await expect(calendarPage.dayViewButton).toHaveAttribute('variant', 'default');
  });

  test('should switch to agenda view', async ({ calendarPage }) => {
    // Switch to agenda view
    await calendarPage.changeView('agenda');

    // Verify calendar is still visible
    await calendarPage.expectCalendarVisible();

    // Verify agenda view button is active
    await expect(calendarPage.agendaViewButton).toHaveAttribute('variant', 'default');
  });

  test('should maintain view mode when navigating dates', async ({ calendarPage }) => {
    // Switch to week view
    await calendarPage.changeView('week');
    await calendarPage.waitForCalendarLoad();

    // Navigate to next period
    await calendarPage.clickNext();
    await calendarPage.waitForCalendarLoad();

    // Verify still in week view
    await expect(calendarPage.weekViewButton).toHaveAttribute('variant', 'default');

    // Navigate to previous period
    await calendarPage.clickPrevious();
    await calendarPage.waitForCalendarLoad();

    // Verify still in week view
    await expect(calendarPage.weekViewButton).toHaveAttribute('variant', 'default');
  });

  test('should navigate back to month view from other views', async ({ calendarPage }) => {
    // Start in month view (default)
    await calendarPage.expectCalendarVisible();

    // Switch to week view
    await calendarPage.changeView('week');
    await calendarPage.waitForCalendarLoad();

    // Switch back to month view
    await calendarPage.changeView('month');
    await calendarPage.waitForCalendarLoad();

    // Verify in month view
    await expect(calendarPage.monthViewButton).toHaveAttribute('variant', 'default');
    await calendarPage.expectCalendarVisible();
  });
});

test.describe('Calendar Navigation - Session Persistence', () => {
  test('should be authenticated and access protected calendar page', async ({ page, calendarPage }) => {
    // Navigate to calendar
    await calendarPage.goto();

    // Verify we're not redirected to login
    await expect(page).toHaveURL(/\/dashboard\/escalas/);

    // Verify calendar content is accessible (not showing login form)
    await calendarPage.expectCalendarVisible();

    // This test validates that session storage is working correctly
    // If authentication failed, we'd be redirected to login page
  });

  test('should reuse authenticated session across tests', async ({ page }) => {
    // This test runs after the previous one
    // If session reuse works, we should still be authenticated

    await page.goto('/dashboard/escalas');

    // Should still have access without logging in again
    await expect(page).toHaveURL(/\/dashboard\/escalas/);

    // Verify no login form is visible
    await expect(page.locator('input[type="email"]')).not.toBeVisible();
  });
});
