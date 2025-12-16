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
}
