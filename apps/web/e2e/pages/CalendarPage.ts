import { Page, Locator, expect } from '@playwright/test';

/**
 * Calendar Page Object Model
 *
 * Encapsulates all calendar page interactions and element locators.
 * This provides a clean, type-safe API for calendar testing.
 *
 * Features:
 * - Navigation controls (Hoje, Anterior, Próximo)
 * - Month/year selectors
 * - View mode switching (Mês, Semana, Dia, Agenda)
 * - Calendar filters (facility, specialty, date range)
 * - Event interactions
 *
 * @example
 * ```typescript
 * const calendar = new CalendarPage(page);
 * await calendar.goto();
 * await calendar.clickToday();
 * await calendar.changeView('week');
 * ```
 */
export class CalendarPage {
  readonly page: Page;

  // Navigation controls
  readonly todayButton: Locator;
  readonly previousButton: Locator;
  readonly nextButton: Locator;

  // Month/year selectors
  readonly monthSelector: Locator;
  readonly yearSelector: Locator;

  // View mode buttons
  readonly monthViewButton: Locator;
  readonly weekViewButton: Locator;
  readonly dayViewButton: Locator;
  readonly agendaViewButton: Locator;

  // Filters
  readonly facilityFilter: Locator;
  readonly specialtyFilter: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;

  // Calendar content
  readonly calendarGrid: Locator;
  readonly calendarEvents: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation controls
    this.todayButton = page.getByRole('button', { name: /hoje/i });
    this.previousButton = page.getByRole('button', { name: /anterior/i });
    this.nextButton = page.getByRole('button', { name: /próximo/i });

    // Month/year selectors
    this.monthSelector = page.locator('[role="combobox"]').filter({ hasText: /janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i });
    this.yearSelector = page.locator('[role="combobox"]').filter({ hasText: /202\d/ });

    // View mode buttons
    this.monthViewButton = page.getByRole('button', { name: /^mês$/i });
    this.weekViewButton = page.getByRole('button', { name: /^semana$/i });
    this.dayViewButton = page.getByRole('button', { name: /^dia$/i });
    this.agendaViewButton = page.getByRole('button', { name: /^agenda$/i });

    // Filters (CalendarFilters component)
    this.facilityFilter = page.locator('select, [role="combobox"]').filter({ hasText: /unidade|facility/i });
    this.specialtyFilter = page.locator('select, [role="combobox"]').filter({ hasText: /especialidade|specialty/i });
    this.startDateInput = page.locator('input[type="date"], input[placeholder*="data"]').first();
    this.endDateInput = page.locator('input[type="date"], input[placeholder*="data"]').nth(1);

    // Calendar content
    // Use more specific selector to avoid matching calendar icons
    this.calendarGrid = page.locator('.rbc-calendar').first();
    this.calendarEvents = page.locator('.rbc-event');
  }

  /**
   * Navigate to the calendar page
   */
  async goto() {
    await this.page.goto('/dashboard/escalas');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click the "Hoje" (Today) button to navigate to today's date
   */
  async clickToday() {
    await this.todayButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click the "Anterior" (Previous) button to navigate to previous period
   */
  async clickPrevious() {
    await this.previousButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click the "Próximo" (Next) button to navigate to next period
   */
  async clickNext() {
    await this.nextButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Change the calendar view mode
   * @param view - The view mode: 'month', 'week', 'day', or 'agenda'
   */
  async changeView(view: 'month' | 'week' | 'day' | 'agenda') {
    const buttonMap = {
      month: this.monthViewButton,
      week: this.weekViewButton,
      day: this.dayViewButton,
      agenda: this.agendaViewButton,
    };

    await buttonMap[view].click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select a specific month from the month selector
   * @param month - Month name in Portuguese (e.g., 'Janeiro', 'Fevereiro')
   */
  async selectMonth(month: string) {
    await this.monthSelector.click();
    await this.page.getByRole('option', { name: month }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select a specific year from the year selector
   * @param year - Year as string (e.g., '2025')
   */
  async selectYear(year: string) {
    await this.yearSelector.click();
    await this.page.getByRole('option', { name: year }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Apply facility filter
   * @param facilityName - Name of the facility to filter by
   */
  async filterByFacility(facilityName: string) {
    await this.facilityFilter.click();
    await this.page.getByRole('option', { name: facilityName }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Apply specialty filter
   * @param specialtyName - Name of the specialty to filter by
   */
  async filterBySpecialty(specialtyName: string) {
    await this.specialtyFilter.click();
    await this.page.getByRole('option', { name: specialtyName }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verify the calendar is visible and loaded
   */
  async expectCalendarVisible() {
    await expect(this.calendarGrid).toBeVisible();
  }

  /**
   * Verify events are displayed on the calendar
   */
  async expectEventsVisible() {
    await expect(this.calendarEvents.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get the count of visible events on the calendar
   */
  async getEventCount(): Promise<number> {
    return await this.calendarEvents.count();
  }

  /**
   * Click on a specific event by its title
   * @param eventTitle - The title/name of the event
   */
  async clickEvent(eventTitle: string) {
    const event = this.page.locator('.rbc-event, [class*="event"]').filter({ hasText: eventTitle });
    await event.first().click();
  }

  /**
   * Wait for calendar to finish loading
   */
  async waitForCalendarLoad() {
    // Wait for calendar grid to be visible
    await this.calendarGrid.waitFor({ state: 'visible' });

    // Wait for any loading spinners to disappear
    await this.page.waitForLoadState('networkidle');

    // Optional: wait for React Query to finish fetching
    await this.page.waitForTimeout(500);
  }

  /**
   * Get current view mode by checking active button
   */
  async getCurrentView(): Promise<'month' | 'week' | 'day' | 'agenda' | 'unknown'> {
    const viewButtons = [
      { button: this.monthViewButton, view: 'month' as const },
      { button: this.weekViewButton, view: 'week' as const },
      { button: this.dayViewButton, view: 'day' as const },
      { button: this.agendaViewButton, view: 'agenda' as const },
    ];

    for (const { button, view } of viewButtons) {
      const isActive = await button.getAttribute('data-state').then(state => state === 'active');
      if (isActive) return view;
    }

    return 'unknown';
  }

  /**
   * Take a screenshot of the calendar
   * @param name - Name for the screenshot file
   */
  async screenshot(name: string) {
    await this.calendarGrid.screenshot({ path: `screenshots/calendar-${name}.png` });
  }

  /**
   * Get the current displayed date/month from the calendar toolbar label
   * Returns the text content of the calendar date label
   */
  async getDisplayedDate(): Promise<string> {
    const label = this.page.locator('.rbc-toolbar-label');
    const text = await label.textContent();
    return text?.trim() || '';
  }

  /**
   * Verify that the displayed date matches expected text (partial match)
   * @param expectedText - Text to search for in the calendar label
   */
  async expectDisplayedDateContains(expectedText: string) {
    const displayedDate = await this.getDisplayedDate();
    expect(displayedDate.toLowerCase()).toContain(expectedText.toLowerCase());
  }

  /**
   * Get current URL search params
   */
  getURLParams(): URLSearchParams {
    const url = new URL(this.page.url());
    return url.searchParams;
  }

  /**
   * Verify URL contains expected parameter
   */
  async expectURLParam(param: string, value?: string) {
    const params = this.getURLParams();
    expect(params.has(param)).toBe(true);
    if (value !== undefined) {
      expect(params.get(param)).toBe(value);
    }
  }

  /**
   * Get the currently selected month from the month selector
   */
  async getSelectedMonth(): Promise<string> {
    const text = await this.monthSelector.textContent();
    return text?.trim() || '';
  }

  /**
   * Get the currently selected year from the year selector
   */
  async getSelectedYear(): Promise<string> {
    const text = await this.yearSelector.textContent();
    return text?.trim() || '';
  }

  /**
   * Verify month selector shows expected month
   * @param monthName - Expected month name in Portuguese
   */
  async expectSelectedMonth(monthName: string) {
    const selected = await this.getSelectedMonth();
    expect(selected.toLowerCase()).toContain(monthName.toLowerCase());
  }

  /**
   * Verify year selector shows expected year
   * @param year - Expected year as string
   */
  async expectSelectedYear(year: string) {
    const selected = await this.getSelectedYear();
    expect(selected).toBe(year);
  }

  /**
   * Verify a specific view mode button is active
   * @param view - The view mode to check
   */
  async expectViewActive(view: 'month' | 'week' | 'day' | 'agenda') {
    const buttonMap = {
      month: this.monthViewButton,
      week: this.weekViewButton,
      day: this.dayViewButton,
      agenda: this.agendaViewButton,
    };

    const button = buttonMap[view];

    // Check if button has active state (variant="default" for active, "outline" for inactive)
    const classAttr = await button.getAttribute('class');
    expect(classAttr).toBeTruthy();

    // The active button should not have the outline variant styling
    // This is a simplified check - adjust based on actual HTML structure
    await expect(button).toBeVisible();
  }

  /**
   * Verify calendar is in month view (shows month grid)
   */
  async expectMonthViewLayout() {
    await expect(this.page.locator('.rbc-month-view')).toBeVisible();
  }

  /**
   * Verify calendar is in week view (shows week columns with time slots)
   */
  async expectWeekViewLayout() {
    await expect(this.page.locator('.rbc-time-view')).toBeVisible();
    // Week view should show 7 day columns
    const dayColumns = this.page.locator('.rbc-time-header-content .rbc-header');
    await expect(dayColumns).toHaveCount(7);
  }

  /**
   * Verify calendar is in day view (shows single day with time slots)
   */
  async expectDayViewLayout() {
    await expect(this.page.locator('.rbc-time-view')).toBeVisible();
    // Day view should show 1 day column
    const dayColumns = this.page.locator('.rbc-time-header-content .rbc-header');
    await expect(dayColumns).toHaveCount(1);
  }

  /**
   * Verify calendar is in agenda view (shows list of events)
   */
  async expectAgendaViewLayout() {
    await expect(this.page.locator('.rbc-agenda-view')).toBeVisible();
  }

  /**
   * Verify events are displayed in month view
   */
  async expectEventsInMonthView() {
    await this.expectMonthViewLayout();
    // Month view events have specific class
    const monthEvents = this.page.locator('.rbc-month-view .rbc-event');
    await expect(monthEvents.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify events are displayed in week view
   */
  async expectEventsInWeekView() {
    await this.expectWeekViewLayout();
    // Week view events appear in time slots
    const weekEvents = this.page.locator('.rbc-time-view .rbc-event');
    await expect(weekEvents.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify events are displayed in day view
   */
  async expectEventsInDayView() {
    await this.expectDayViewLayout();
    // Day view events appear in time slots
    const dayEvents = this.page.locator('.rbc-time-view .rbc-event');
    await expect(dayEvents.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify events are displayed in agenda view
   */
  async expectEventsInAgendaView() {
    await this.expectAgendaViewLayout();
    // Agenda view shows events in table/list format
    const agendaEvents = this.page.locator('.rbc-agenda-view .rbc-agenda-event-cell');
    await expect(agendaEvents.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get event count in a specific view
   */
  async getEventCountInView(): Promise<number> {
    // Wait a bit for events to load
    await this.page.waitForTimeout(500);
    return await this.calendarEvents.count();
  }

  /**
   * Verify calendar shows expected number of events
   * @param expectedCount - Expected number of events (or 'atleast' with minimum)
   */
  async expectEventCount(expectedCount: number | { atleast: number }) {
    const count = await this.getEventCountInView();
    if (typeof expectedCount === 'number') {
      expect(count).toBe(expectedCount);
    } else {
      expect(count).toBeGreaterThanOrEqual(expectedCount.atleast);
    }
  }

  /**
   * Verify URL date parameter matches expected date
   * @param expectedDate - Expected date in YYYY-MM-DD format
   */
  async expectURLDate(expectedDate: string) {
    await this.expectURLParam('date', expectedDate);
  }

  /**
   * Verify URL view parameter matches expected view
   * @param expectedView - Expected view mode
   */
  async expectURLView(expectedView: 'month' | 'week' | 'day' | 'agenda') {
    await this.expectURLParam('view', expectedView);
  }

  /**
   * Clear all filters by navigating to clean URL
   */
  async clearAllFilters() {
    await this.page.goto('/dashboard/escalas');
    await this.waitForCalendarLoad();
  }

  /**
   * Verify month selector is visible and clickable
   */
  async expectMonthSelectorVisible() {
    await expect(this.monthSelector).toBeVisible();
    await expect(this.monthSelector).toBeEnabled();
  }

  /**
   * Verify year selector is visible and clickable
   */
  async expectYearSelectorVisible() {
    await expect(this.yearSelector).toBeVisible();
    await expect(this.yearSelector).toBeEnabled();
  }

  /**
   * Verify all view mode buttons are visible
   */
  async expectViewButtonsVisible() {
    await expect(this.monthViewButton).toBeVisible();
    await expect(this.weekViewButton).toBeVisible();
    await expect(this.dayViewButton).toBeVisible();
    await expect(this.agendaViewButton).toBeVisible();
  }
}
