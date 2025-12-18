/**
 * E2E Tests: Calendar Month and Year Selectors
 *
 * Tests the month and year selector dropdowns in the calendar toolbar.
 * Verifies that selecting different months and years updates the calendar
 * correctly, maintains state in URL parameters, and works across all view modes.
 *
 * Test Coverage:
 * - Month selector functionality in all view modes
 * - Year selector functionality in all view modes
 * - Combined month + year selections
 * - URL parameter synchronization
 * - Edge cases (month/year boundaries, leap years)
 * - Date validation and persistence
 */

import { test } from '../fixtures/calendar.fixtures';
import { expect } from '@playwright/test';

test.describe('Calendar Month Selector', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should display month selector with current month', async ({ calendarPage }) => {
    await calendarPage.expectMonthSelectorVisible();

    // Get selected month and verify it's a valid Portuguese month name
    const selectedMonth = await calendarPage.getSelectedMonth();
    const validMonths = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];

    const isValidMonth = validMonths.some(month =>
      selectedMonth.toLowerCase().includes(month)
    );

    expect(isValidMonth).toBe(true);
  });

  test('should change calendar when selecting different month', async ({ calendarPage }) => {
    // Select a different month
    await calendarPage.selectMonth('Janeiro');
    await calendarPage.waitForCalendarLoad();

    // Verify month selector updated
    await calendarPage.expectSelectedMonth('Janeiro');

    // Verify calendar display updated
    await calendarPage.expectDisplayedDateContains('janeiro');
  });

  test('should update URL parameter when month changes', async ({ calendarPage }) => {
    await calendarPage.selectMonth('Março');
    await calendarPage.waitForCalendarLoad();

    // URL should contain the updated date
    const params = calendarPage.getURLParams();
    expect(params.has('date')).toBe(true);

    const dateParam = params.get('date');
    expect(dateParam).toBeTruthy();
    // Date should be in March (month 03)
    expect(dateParam).toMatch(/\d{4}-03-\d{2}/);
  });

  test('should maintain selected month across view mode changes', async ({ calendarPage }) => {
    // Select a specific month
    await calendarPage.selectMonth('Junho');
    await calendarPage.waitForCalendarLoad();

    // Change view modes and verify month persists
    const views: Array<'week' | 'day' | 'agenda' | 'month'> = ['week', 'day', 'agenda', 'month'];

    for (const view of views) {
      await calendarPage.changeView(view);
      await calendarPage.waitForCalendarLoad();

      await calendarPage.expectSelectedMonth('Junho');
      await calendarPage.expectDisplayedDateContains('junho');
    }
  });

  test('should select month in month view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('month');
    await calendarPage.selectMonth('Setembro');
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectMonthViewLayout();
    await calendarPage.expectSelectedMonth('Setembro');
    await calendarPage.expectDisplayedDateContains('setembro');
  });

  test('should select month in week view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('week');
    await calendarPage.selectMonth('Abril');
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectWeekViewLayout();
    await calendarPage.expectSelectedMonth('Abril');
  });

  test('should select month in day view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('day');
    await calendarPage.selectMonth('Julho');
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectDayViewLayout();
    await calendarPage.expectSelectedMonth('Julho');
  });

  test('should select month in agenda view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('agenda');
    await calendarPage.selectMonth('Outubro');
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectAgendaViewLayout();
    await calendarPage.expectSelectedMonth('Outubro');
  });

  test('should handle month selection at year boundary', async ({ calendarPage }) => {
    // Select December
    await calendarPage.selectMonth('Dezembro');
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectSelectedMonth('Dezembro');
    await calendarPage.expectDisplayedDateContains('dezembro');

    // Select January (should stay in same year)
    await calendarPage.selectMonth('Janeiro');
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectSelectedMonth('Janeiro');
    await calendarPage.expectDisplayedDateContains('janeiro');
  });

  test('should handle rapid month selections without errors', async ({ calendarPage }) => {
    const months = ['Janeiro', 'Março', 'Maio', 'Julho'];

    for (const month of months) {
      await calendarPage.selectMonth(month);
      // Shorter wait for rapid selection test
      await calendarPage.page.waitForTimeout(300);
    }

    // Verify last selection is reflected
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectSelectedMonth('Julho');
  });
});

test.describe('Calendar Year Selector', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should display year selector with current year', async ({ calendarPage }) => {
    await calendarPage.expectYearSelectorVisible();

    // Get selected year and verify it's a valid year (202X format)
    const selectedYear = await calendarPage.getSelectedYear();
    expect(selectedYear).toMatch(/202\d/);
  });

  test('should change calendar when selecting different year', async ({ calendarPage }) => {
    // Get current year first
    const currentYear = await calendarPage.getSelectedYear();
    const nextYear = String(parseInt(currentYear) + 1);

    // Select next year
    await calendarPage.selectYear(nextYear);
    await calendarPage.waitForCalendarLoad();

    // Verify year selector updated
    await calendarPage.expectSelectedYear(nextYear);

    // Verify calendar display updated (should show the new year)
    await calendarPage.expectDisplayedDateContains(nextYear);
  });

  test('should update URL parameter when year changes', async ({ calendarPage }) => {
    const currentYear = await calendarPage.getSelectedYear();
    const previousYear = String(parseInt(currentYear) - 1);

    await calendarPage.selectYear(previousYear);
    await calendarPage.waitForCalendarLoad();

    // URL should contain the updated date
    const params = calendarPage.getURLParams();
    expect(params.has('date')).toBe(true);

    const dateParam = params.get('date');
    expect(dateParam).toBeTruthy();
    // Date should contain the previous year
    expect(dateParam).toContain(previousYear);
  });

  test('should maintain selected year across view mode changes', async ({ calendarPage }) => {
    const currentYear = await calendarPage.getSelectedYear();
    const targetYear = String(parseInt(currentYear) + 1);

    // Select a specific year
    await calendarPage.selectYear(targetYear);
    await calendarPage.waitForCalendarLoad();

    // Change view modes and verify year persists
    const views: Array<'week' | 'day' | 'agenda' | 'month'> = ['week', 'day', 'agenda', 'month'];

    for (const view of views) {
      await calendarPage.changeView(view);
      await calendarPage.waitForCalendarLoad();

      await calendarPage.expectSelectedYear(targetYear);
      await calendarPage.expectDisplayedDateContains(targetYear);
    }
  });

  test('should select year in month view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('month');

    const currentYear = await calendarPage.getSelectedYear();
    const targetYear = String(parseInt(currentYear) - 1);

    await calendarPage.selectYear(targetYear);
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectMonthViewLayout();
    await calendarPage.expectSelectedYear(targetYear);
    await calendarPage.expectDisplayedDateContains(targetYear);
  });

  test('should select year in week view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('week');

    const currentYear = await calendarPage.getSelectedYear();
    const targetYear = String(parseInt(currentYear) + 1);

    await calendarPage.selectYear(targetYear);
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectWeekViewLayout();
    await calendarPage.expectSelectedYear(targetYear);
  });

  test('should select year in day view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('day');

    const currentYear = await calendarPage.getSelectedYear();
    const targetYear = String(parseInt(currentYear) - 1);

    await calendarPage.selectYear(targetYear);
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectDayViewLayout();
    await calendarPage.expectSelectedYear(targetYear);
  });

  test('should select year in agenda view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('agenda');

    const currentYear = await calendarPage.getSelectedYear();
    const targetYear = String(parseInt(currentYear) + 1);

    await calendarPage.selectYear(targetYear);
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectAgendaViewLayout();
    await calendarPage.expectSelectedYear(targetYear);
  });

  test('should handle multi-year jumps correctly', async ({ calendarPage }) => {
    const currentYear = await calendarPage.getSelectedYear();
    const futureYear = String(parseInt(currentYear) + 3);

    await calendarPage.selectYear(futureYear);
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectSelectedYear(futureYear);
    await calendarPage.expectDisplayedDateContains(futureYear);
  });

  test('should handle rapid year selections without errors', async ({ calendarPage }) => {
    const currentYear = await calendarPage.getSelectedYear();
    const years = [
      String(parseInt(currentYear) - 1),
      String(parseInt(currentYear) + 1),
      currentYear,
    ];

    for (const year of years) {
      await calendarPage.selectYear(year);
      // Shorter wait for rapid selection test
      await calendarPage.page.waitForTimeout(300);
    }

    // Verify last selection is reflected
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectSelectedYear(currentYear);
  });
});

test.describe('Combined Month and Year Selection', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should select both month and year and update calendar', async ({ calendarPage }) => {
    const currentYear = await calendarPage.getSelectedYear();
    const targetYear = String(parseInt(currentYear) + 1);

    // Select year first
    await calendarPage.selectYear(targetYear);
    await calendarPage.waitForCalendarLoad();

    // Then select month
    await calendarPage.selectMonth('Maio');
    await calendarPage.waitForCalendarLoad();

    // Verify both are reflected
    await calendarPage.expectSelectedYear(targetYear);
    await calendarPage.expectSelectedMonth('Maio');
    await calendarPage.expectDisplayedDateContains('maio');
    await calendarPage.expectDisplayedDateContains(targetYear);
  });

  test('should update URL with both month and year', async ({ calendarPage }) => {
    const currentYear = await calendarPage.getSelectedYear();
    const targetYear = String(parseInt(currentYear) - 1);

    await calendarPage.selectYear(targetYear);
    await calendarPage.selectMonth('Agosto');
    await calendarPage.waitForCalendarLoad();

    const params = calendarPage.getURLParams();
    const dateParam = params.get('date');

    expect(dateParam).toBeTruthy();
    expect(dateParam).toContain(targetYear);
    expect(dateParam).toMatch(/\d{4}-08-\d{2}/); // August is month 08
  });

  test('should maintain combined selection across navigation', async ({ calendarPage }) => {
    const currentYear = await calendarPage.getSelectedYear();
    const targetYear = String(parseInt(currentYear) + 1);

    await calendarPage.selectYear(targetYear);
    await calendarPage.selectMonth('Novembro');
    await calendarPage.waitForCalendarLoad();

    // Navigate next and previous
    await calendarPage.clickNext();
    await calendarPage.waitForCalendarLoad();
    await calendarPage.clickPrevious();
    await calendarPage.waitForCalendarLoad();

    // Original selections should be restored
    await calendarPage.expectSelectedYear(targetYear);
    await calendarPage.expectSelectedMonth('Novembro');
  });

  test('should handle month selection in different year correctly', async ({ calendarPage }) => {
    const currentYear = await calendarPage.getSelectedYear();
    const futureYear = String(parseInt(currentYear) + 2);

    // Go to future year, February
    await calendarPage.selectYear(futureYear);
    await calendarPage.selectMonth('Fevereiro');
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectSelectedYear(futureYear);
    await calendarPage.expectSelectedMonth('Fevereiro');

    // Calendar should display February of the future year
    await calendarPage.expectDisplayedDateContains('fevereiro');
    await calendarPage.expectDisplayedDateContains(futureYear);
  });

  test('should handle rapid combined selections', async ({ calendarPage }) => {
    const currentYear = await calendarPage.getSelectedYear();
    const targetYear = String(parseInt(currentYear) + 1);

    // Rapid selections
    await calendarPage.selectMonth('Janeiro');
    await calendarPage.page.waitForTimeout(200);
    await calendarPage.selectYear(targetYear);
    await calendarPage.page.waitForTimeout(200);
    await calendarPage.selectMonth('Dezembro');
    await calendarPage.page.waitForTimeout(200);

    await calendarPage.waitForCalendarLoad();

    // Verify final state
    await calendarPage.expectSelectedYear(targetYear);
    await calendarPage.expectSelectedMonth('Dezembro');
  });

  test('should preserve view mode during combined selections', async ({ calendarPage }) => {
    await calendarPage.changeView('week');
    await calendarPage.waitForCalendarLoad();

    const currentYear = await calendarPage.getSelectedYear();
    const targetYear = String(parseInt(currentYear) + 1);

    await calendarPage.selectYear(targetYear);
    await calendarPage.selectMonth('Abril');
    await calendarPage.waitForCalendarLoad();

    // Week view should still be active
    await calendarPage.expectWeekViewLayout();
    await calendarPage.expectURLView('week');
  });

  test('should handle edge case: leap year February', async ({ calendarPage }) => {
    // 2024 is a leap year
    await calendarPage.selectYear('2024');
    await calendarPage.selectMonth('Fevereiro');
    await calendarPage.waitForCalendarLoad();

    await calendarPage.expectSelectedYear('2024');
    await calendarPage.expectSelectedMonth('Fevereiro');

    // Calendar should handle Feb 29, 2024
    await calendarPage.expectCalendarVisible();
  });

  test('should handle edge case: non-leap year February transition', async ({ calendarPage }) => {
    // If current date is Feb 29 (leap year), selecting non-leap year should adjust
    // This test verifies date validation works correctly

    // Go to leap year Feb 29
    await calendarPage.selectYear('2024');
    await calendarPage.selectMonth('Fevereiro');
    await calendarPage.waitForCalendarLoad();

    // Navigate to a specific day (if in day view)
    await calendarPage.changeView('day');
    await calendarPage.waitForCalendarLoad();

    // Now switch to non-leap year
    await calendarPage.selectYear('2025');
    await calendarPage.waitForCalendarLoad();

    // Should not crash, should adjust to Feb 28
    await calendarPage.expectSelectedYear('2025');
    await calendarPage.expectCalendarVisible();
  });

  test('should handle month with 31 days to month with 30 days transition', async ({ calendarPage }) => {
    // Go to January 31
    await calendarPage.selectMonth('Janeiro');
    await calendarPage.waitForCalendarLoad();

    // Switch to April (30 days)
    await calendarPage.selectMonth('Abril');
    await calendarPage.waitForCalendarLoad();

    // Should not crash, should adjust to April 30 if needed
    await calendarPage.expectSelectedMonth('Abril');
    await calendarPage.expectCalendarVisible();
  });

  test('should persist combined filters in browser history', async ({ calendarPage, page }) => {
    const currentYear = await calendarPage.getSelectedYear();
    const targetYear = String(parseInt(currentYear) + 1);

    // Make selection
    await calendarPage.selectYear(targetYear);
    await calendarPage.selectMonth('Julho');
    await calendarPage.waitForCalendarLoad();

    // Navigate to another page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await calendarPage.waitForCalendarLoad();

    // Selections should be restored from URL
    await calendarPage.expectSelectedYear(targetYear);
    await calendarPage.expectSelectedMonth('Julho');
  });
});
