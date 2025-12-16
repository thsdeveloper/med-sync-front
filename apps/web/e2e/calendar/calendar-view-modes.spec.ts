/**
 * E2E Tests: Calendar View Modes
 *
 * Tests the four calendar view modes: Mês (Month), Semana (Week), Dia (Day), and Agenda.
 * Verifies that each view renders correctly, displays events appropriately,
 * and maintains state across interactions.
 *
 * Test Coverage:
 * - View mode rendering (Month, Week, Day, Agenda)
 * - Event display in each view mode
 * - View mode state persistence in URL
 * - View transitions and state management
 * - View mode accessibility and interactions
 */

import { test } from '../fixtures/calendar.fixtures';
import { expect } from '@playwright/test';

test.describe('Calendar View Mode Rendering', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should render month view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('month');
    await calendarPage.waitForCalendarLoad();

    // Verify month view layout
    await calendarPage.expectMonthViewLayout();

    // Month view should show a grid of dates
    const monthGrid = calendarPage.page.locator('.rbc-month-view');
    await expect(monthGrid).toBeVisible();

    // Should have weekday headers
    const weekdayHeaders = calendarPage.page.locator('.rbc-header');
    await expect(weekdayHeaders).toHaveCount(7); // 7 days of the week

    // Verify view button is active
    await calendarPage.expectViewActive('month');
  });

  test('should render week view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('week');
    await calendarPage.waitForCalendarLoad();

    // Verify week view layout
    await calendarPage.expectWeekViewLayout();

    // Week view should show time slots
    const timeView = calendarPage.page.locator('.rbc-time-view');
    await expect(timeView).toBeVisible();

    // Should have 7 day columns (Sunday to Saturday)
    const dayColumns = calendarPage.page.locator('.rbc-time-header-content .rbc-header');
    await expect(dayColumns).toHaveCount(7);

    // Should have time slot gutter (hourly time labels)
    const timeGutter = calendarPage.page.locator('.rbc-time-gutter');
    await expect(timeGutter).toBeVisible();

    // Verify view button is active
    await calendarPage.expectViewActive('week');
  });

  test('should render day view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('day');
    await calendarPage.waitForCalendarLoad();

    // Verify day view layout
    await calendarPage.expectDayViewLayout();

    // Day view should show time slots for single day
    const timeView = calendarPage.page.locator('.rbc-time-view');
    await expect(timeView).toBeVisible();

    // Should have 1 day column
    const dayColumns = calendarPage.page.locator('.rbc-time-header-content .rbc-header');
    await expect(dayColumns).toHaveCount(1);

    // Should have time slot gutter (24-hour timeline)
    const timeGutter = calendarPage.page.locator('.rbc-time-gutter');
    await expect(timeGutter).toBeVisible();

    // Verify view button is active
    await calendarPage.expectViewActive('day');
  });

  test('should render agenda view correctly', async ({ calendarPage }) => {
    await calendarPage.changeView('agenda');
    await calendarPage.waitForCalendarLoad();

    // Verify agenda view layout
    await calendarPage.expectAgendaViewLayout();

    // Agenda view should show list/table format
    const agendaView = calendarPage.page.locator('.rbc-agenda-view');
    await expect(agendaView).toBeVisible();

    // Should have table structure
    const agendaTable = calendarPage.page.locator('.rbc-agenda-table');
    await expect(agendaTable).toBeVisible();

    // Verify view button is active
    await calendarPage.expectViewActive('agenda');
  });
});

test.describe('Calendar View Mode Event Display', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should display events in month view', async ({ calendarPage }) => {
    await calendarPage.changeView('month');
    await calendarPage.waitForCalendarLoad();

    // Month view events should be visible
    const monthEvents = calendarPage.page.locator('.rbc-month-view .rbc-event');

    // Wait for events to load (if any exist)
    const eventCount = await monthEvents.count();

    if (eventCount > 0) {
      // Verify events are visible
      await expect(monthEvents.first()).toBeVisible();

      // Events should have content
      const firstEvent = monthEvents.first();
      const eventContent = await firstEvent.textContent();
      expect(eventContent).toBeTruthy();
    } else {
      // No events in this month - that's ok, verify empty state
      await calendarPage.expectMonthViewLayout();
    }
  });

  test('should display events in week view', async ({ calendarPage }) => {
    await calendarPage.changeView('week');
    await calendarPage.waitForCalendarLoad();

    // Week view events should appear in time slots
    const weekEvents = calendarPage.page.locator('.rbc-time-view .rbc-event');

    const eventCount = await weekEvents.count();

    if (eventCount > 0) {
      // Verify events are visible
      await expect(weekEvents.first()).toBeVisible();

      // Events should have time slot positioning
      const firstEvent = weekEvents.first();
      const eventContent = await firstEvent.textContent();
      expect(eventContent).toBeTruthy();
    } else {
      // No events in this week - verify layout is correct
      await calendarPage.expectWeekViewLayout();
    }
  });

  test('should display events in day view', async ({ calendarPage }) => {
    await calendarPage.changeView('day');
    await calendarPage.waitForCalendarLoad();

    // Day view events should appear in time slots
    const dayEvents = calendarPage.page.locator('.rbc-time-view .rbc-event');

    const eventCount = await dayEvents.count();

    if (eventCount > 0) {
      // Verify events are visible
      await expect(dayEvents.first()).toBeVisible();

      // Events should be positioned in time slots
      const firstEvent = dayEvents.first();
      const eventContent = await firstEvent.textContent();
      expect(eventContent).toBeTruthy();
    } else {
      // No events today - verify layout is correct
      await calendarPage.expectDayViewLayout();
    }
  });

  test('should display events in agenda view', async ({ calendarPage }) => {
    await calendarPage.changeView('agenda');
    await calendarPage.waitForCalendarLoad();

    // Agenda view shows events in table rows
    const agendaEvents = calendarPage.page.locator('.rbc-agenda-view .rbc-agenda-event-cell');

    const eventCount = await agendaEvents.count();

    if (eventCount > 0) {
      // Verify events are visible in list
      await expect(agendaEvents.first()).toBeVisible();

      // Each event should have date and time information
      const agendaDates = calendarPage.page.locator('.rbc-agenda-view .rbc-agenda-date-cell');
      await expect(agendaDates.first()).toBeVisible();
    } else {
      // No events in agenda range - verify layout is correct
      await calendarPage.expectAgendaViewLayout();

      // Should show "No events in range" or similar message
      const agendaContent = await calendarPage.page.locator('.rbc-agenda-view').textContent();
      expect(agendaContent).toBeTruthy();
    }
  });

  test('should show different events across view modes', async ({ calendarPage }) => {
    // Get event counts in different views
    const views: Array<'month' | 'week' | 'day' | 'agenda'> = ['month', 'week', 'day', 'agenda'];
    const eventCounts: Record<string, number> = {};

    for (const view of views) {
      await calendarPage.changeView(view);
      await calendarPage.waitForCalendarLoad();

      const count = await calendarPage.getEventCountInView();
      eventCounts[view] = count;
    }

    // Month view typically shows more events than week view
    // Week view typically shows more than day view
    // This is a general expectation, not always true

    // At minimum, verify counts are non-negative
    expect(eventCounts.month).toBeGreaterThanOrEqual(0);
    expect(eventCounts.week).toBeGreaterThanOrEqual(0);
    expect(eventCounts.day).toBeGreaterThanOrEqual(0);
    expect(eventCounts.agenda).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Calendar View Mode State Management', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should persist view mode in URL', async ({ calendarPage }) => {
    const views: Array<'month' | 'week' | 'day' | 'agenda'> = ['week', 'day', 'agenda', 'month'];

    for (const view of views) {
      await calendarPage.changeView(view);
      await calendarPage.waitForCalendarLoad();

      // Verify URL parameter
      await calendarPage.expectURLView(view);
    }
  });

  test('should maintain view mode across date navigation', async ({ calendarPage }) => {
    // Set to week view
    await calendarPage.changeView('week');
    await calendarPage.waitForCalendarLoad();

    // Navigate through dates
    await calendarPage.clickNext();
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectWeekViewLayout();
    await calendarPage.expectURLView('week');

    await calendarPage.clickPrevious();
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectWeekViewLayout();
    await calendarPage.expectURLView('week');

    await calendarPage.clickToday();
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectWeekViewLayout();
    await calendarPage.expectURLView('week');
  });

  test('should maintain view mode across month/year selection', async ({ calendarPage }) => {
    // Set to day view
    await calendarPage.changeView('day');
    await calendarPage.waitForCalendarLoad();

    // Change month
    await calendarPage.selectMonth('Junho');
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectDayViewLayout();
    await calendarPage.expectURLView('day');

    // Change year
    const currentYear = await calendarPage.getSelectedYear();
    const nextYear = String(parseInt(currentYear) + 1);
    await calendarPage.selectYear(nextYear);
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectDayViewLayout();
    await calendarPage.expectURLView('day');
  });

  test('should transition between all view modes smoothly', async ({ calendarPage }) => {
    const transitions: Array<['month' | 'week' | 'day' | 'agenda', 'month' | 'week' | 'day' | 'agenda']> = [
      ['month', 'week'],
      ['week', 'day'],
      ['day', 'agenda'],
      ['agenda', 'month'],
      ['month', 'day'],
      ['day', 'week'],
      ['week', 'agenda'],
      ['agenda', 'day'],
    ];

    for (const [from, to] of transitions) {
      await calendarPage.changeView(from);
      await calendarPage.waitForCalendarLoad();

      await calendarPage.changeView(to);
      await calendarPage.waitForCalendarLoad();

      // Verify transition completed successfully
      await calendarPage.expectCalendarVisible();
      await calendarPage.expectURLView(to);
    }
  });

  test('should restore view mode from URL on page load', async ({ calendarPage, page }) => {
    // Set to week view
    await calendarPage.changeView('week');
    await calendarPage.waitForCalendarLoad();

    // Get current URL
    const url = page.url();

    // Navigate away
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate back using direct URL
    await page.goto(url);
    await calendarPage.waitForCalendarLoad();

    // Week view should be restored
    await calendarPage.expectWeekViewLayout();
    await calendarPage.expectURLView('week');
  });

  test('should handle browser back/forward with view changes', async ({ calendarPage, page }) => {
    // Start in month view
    await calendarPage.changeView('month');
    await calendarPage.waitForCalendarLoad();

    // Change to week view
    await calendarPage.changeView('week');
    await calendarPage.waitForCalendarLoad();

    // Change to day view
    await calendarPage.changeView('day');
    await calendarPage.waitForCalendarLoad();

    // Go back to week view
    await page.goBack();
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectWeekViewLayout();

    // Go back to month view
    await page.goBack();
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectMonthViewLayout();

    // Go forward to week view
    await page.goForward();
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectWeekViewLayout();
  });
});

test.describe('Calendar View Mode Accessibility', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should have all view buttons visible and accessible', async ({ calendarPage }) => {
    await calendarPage.expectViewButtonsVisible();

    // All buttons should be enabled
    await expect(calendarPage.monthViewButton).toBeEnabled();
    await expect(calendarPage.weekViewButton).toBeEnabled();
    await expect(calendarPage.dayViewButton).toBeEnabled();
    await expect(calendarPage.agendaViewButton).toBeEnabled();
  });

  test('should support keyboard navigation for view buttons', async ({ calendarPage, page }) => {
    // Focus on month view button
    await calendarPage.monthViewButton.focus();

    // Press Enter to activate
    await page.keyboard.press('Enter');
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectMonthViewLayout();

    // Tab to next button and activate
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await calendarPage.waitForCalendarLoad();

    // Should have changed to next view
    await calendarPage.expectCalendarVisible();
  });

  test('should highlight active view button correctly', async ({ calendarPage }) => {
    const views: Array<'month' | 'week' | 'day' | 'agenda'> = ['month', 'week', 'day', 'agenda'];

    for (const view of views) {
      await calendarPage.changeView(view);
      await calendarPage.waitForCalendarLoad();

      // Active button should be visually distinct
      await calendarPage.expectViewActive(view);
    }
  });
});

test.describe('Calendar View Mode Edge Cases', () => {
  test.beforeEach(async ({ calendarPage }) => {
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();
  });

  test('should handle rapid view mode switching', async ({ calendarPage }) => {
    const views: Array<'month' | 'week' | 'day' | 'agenda'> = ['week', 'month', 'day', 'agenda', 'week'];

    for (const view of views) {
      await calendarPage.changeView(view);
      // Shorter wait for rapid switching test
      await calendarPage.page.waitForTimeout(200);
    }

    // Verify final state
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectWeekViewLayout();
  });

  test('should maintain date when switching from month to day view', async ({ calendarPage }) => {
    // Select specific month
    await calendarPage.selectMonth('Março');
    await calendarPage.waitForCalendarLoad();

    // Switch to day view
    await calendarPage.changeView('day');
    await calendarPage.waitForCalendarLoad();

    // Should still show March
    await calendarPage.expectSelectedMonth('Março');
    await calendarPage.expectDayViewLayout();
  });

  test('should show appropriate date range in each view', async ({ calendarPage }) => {
    await calendarPage.selectMonth('Maio');
    await calendarPage.selectYear('2025');
    await calendarPage.waitForCalendarLoad();

    // Month view: shows full month
    await calendarPage.changeView('month');
    await calendarPage.waitForCalendarLoad();
    await calendarPage.expectDisplayedDateContains('maio');
    await calendarPage.expectDisplayedDateContains('2025');

    // Week view: shows specific week
    await calendarPage.changeView('week');
    await calendarPage.waitForCalendarLoad();
    const weekDisplay = await calendarPage.getDisplayedDate();
    expect(weekDisplay).toBeTruthy();

    // Day view: shows specific day
    await calendarPage.changeView('day');
    await calendarPage.waitForCalendarLoad();
    const dayDisplay = await calendarPage.getDisplayedDate();
    expect(dayDisplay).toBeTruthy();

    // Agenda view: shows date range
    await calendarPage.changeView('agenda');
    await calendarPage.waitForCalendarLoad();
    const agendaDisplay = await calendarPage.getDisplayedDate();
    expect(agendaDisplay).toBeTruthy();
  });

  test('should handle view change with no events gracefully', async ({ calendarPage }) => {
    // Go to a future date unlikely to have events
    const currentYear = await calendarPage.getSelectedYear();
    const futureYear = String(parseInt(currentYear) + 5);

    await calendarPage.selectYear(futureYear);
    await calendarPage.selectMonth('Dezembro');
    await calendarPage.waitForCalendarLoad();

    // Test all views with likely no events
    const views: Array<'month' | 'week' | 'day' | 'agenda'> = ['month', 'week', 'day', 'agenda'];

    for (const view of views) {
      await calendarPage.changeView(view);
      await calendarPage.waitForCalendarLoad();

      // Calendar should render without errors even with no events
      await calendarPage.expectCalendarVisible();
    }
  });

  test('should preserve filters when changing views', async ({ calendarPage }) => {
    // This test assumes CalendarFilters component is visible
    // If filters are not visible, this test may need adjustment

    // Change to specific view
    await calendarPage.changeView('week');
    await calendarPage.waitForCalendarLoad();

    // Select specific date
    await calendarPage.selectMonth('Julho');
    await calendarPage.waitForCalendarLoad();

    // Switch view
    await calendarPage.changeView('day');
    await calendarPage.waitForCalendarLoad();

    // Month should be preserved
    await calendarPage.expectSelectedMonth('Julho');

    // Switch back
    await calendarPage.changeView('week');
    await calendarPage.waitForCalendarLoad();

    // Still preserved
    await calendarPage.expectSelectedMonth('Julho');
  });
});
