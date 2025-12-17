import { Page, Locator, expect } from '@playwright/test';

/**
 * Clinicas Page Object Model
 *
 * Encapsulates all clinicas table interactions and element locators.
 * This provides a clean, type-safe API for clinicas table testing.
 *
 * Features:
 * - Table navigation and data loading
 * - Search functionality
 * - Filtering by status (active/inactive)
 * - Sorting by name, status, created_at
 * - Pagination controls (next, previous, page size)
 * - CRUD operations (create, edit, delete)
 * - Data verification and assertions
 *
 * @example
 * ```typescript
 * const clinicas = new ClinicasPage(page);
 * await clinicas.goto();
 * await clinicas.searchClinic('Hospital ABC');
 * await clinicas.clickCreateButton();
 * ```
 */
export class ClinicasPage {
  readonly page: Page;

  // Page header elements
  readonly pageTitle: Locator;
  readonly createButton: Locator;

  // Table elements
  readonly table: Locator;
  readonly tableRows: Locator;
  readonly loadingSkeleton: Locator;
  readonly emptyMessage: Locator;

  // Search and filters
  readonly searchInput: Locator;
  readonly statusFilter: Locator;

  // Pagination controls
  readonly paginationInfo: Locator;
  readonly previousPageButton: Locator;
  readonly nextPageButton: Locator;
  readonly pageSizeSelector: Locator;

  // Form elements (FacilitySheet)
  readonly sheetDialog: Locator;
  readonly nameInput: Locator;
  readonly typeSelect: Locator;
  readonly cnpjInput: Locator;
  readonly phoneInput: Locator;
  readonly activeCheckbox: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  // Action menu elements
  readonly actionMenuTrigger: Locator;
  readonly editMenuItem: Locator;
  readonly deleteMenuItem: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page header elements
    this.pageTitle = page.getByRole('heading', { name: /clínicas e hospitais/i });
    this.createButton = page.getByRole('button', { name: /nova unidade/i });

    // Table elements - using DataTable component selectors
    this.table = page.locator('table').first();
    this.tableRows = page.locator('tbody tr');
    this.loadingSkeleton = page.locator('[data-testid="table-loading"]').or(page.locator('.animate-pulse'));
    this.emptyMessage = page.getByText(/nenhuma unidade cadastrada/i);

    // Search and filters
    this.searchInput = page.getByPlaceholder(/buscar por nome/i);
    this.statusFilter = page.locator('[role="combobox"]').filter({ hasText: /status|filtrar/i });

    // Pagination controls
    this.paginationInfo = page.locator('text=/página \\d+ de \\d+/i').or(page.locator('[data-testid="pagination-info"]'));
    this.previousPageButton = page.getByRole('button', { name: /anterior|previous/i });
    this.nextPageButton = page.getByRole('button', { name: /próxima|next/i });
    this.pageSizeSelector = page.locator('select').filter({ hasText: /10|25|50|100/ }).or(
      page.locator('[role="combobox"]').filter({ hasText: /linhas por página/i })
    );

    // Form elements (FacilitySheet) - these appear when create/edit is triggered
    this.sheetDialog = page.locator('[role="dialog"]').or(page.locator('[data-sheet="facility"]'));
    this.nameInput = page.getByLabel(/nome/i).or(page.locator('input[name="name"]'));
    this.typeSelect = page.locator('select[name="type"]').or(page.getByLabel(/tipo/i));
    this.cnpjInput = page.getByLabel(/cnpj/i).or(page.locator('input[name="cnpj"]'));
    this.phoneInput = page.getByLabel(/telefone|phone/i).or(page.locator('input[name="phone"]'));
    this.activeCheckbox = page.locator('input[name="active"]').or(page.getByLabel(/ativa|active/i));
    this.submitButton = page.getByRole('button', { name: /salvar|criar|cadastrar/i });
    this.cancelButton = page.getByRole('button', { name: /cancelar/i });

    // Action menu elements (dropdown)
    this.actionMenuTrigger = page.locator('button[aria-haspopup="menu"]').first();
    this.editMenuItem = page.getByRole('menuitem', { name: /editar/i });
    this.deleteMenuItem = page.getByRole('menuitem', { name: /excluir/i });
  }

  /**
   * Navigate to the clinicas page
   */
  async goto() {
    await this.page.goto('/dashboard/organizacao/clinicas');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for the table to finish loading
   */
  async waitForTableLoad() {
    // Wait for page to be visible
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for any loading skeletons to disappear
    await this.loadingSkeleton.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Loading skeleton might not exist if data loads very fast
    });

    // Wait for network idle
    await this.page.waitForLoadState('networkidle');

    // Give React Query time to settle
    await this.page.waitForTimeout(500);
  }

  /**
   * Search for a clinic by name
   * @param searchTerm - The clinic name to search for
   */
  async searchClinic(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    // Wait for search debounce and table update
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear search input
   */
  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter clinics by status
   * @param status - 'active', 'inactive', or 'all'
   */
  async filterByStatus(status: 'active' | 'inactive' | 'all') {
    await this.statusFilter.click();

    const optionText = status === 'active' ? /ativa/i : status === 'inactive' ? /inativa/i : /todas/i;
    await this.page.getByRole('option', { name: optionText }).click();

    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Sort table by a specific column
   * @param columnName - Name of the column to sort
   */
  async sortByColumn(columnName: 'name' | 'status' | 'created_at') {
    const columnMap = {
      name: /unidade/i,
      status: /status/i,
      created_at: /cadastrada em/i,
    };

    const columnHeader = this.page.getByRole('columnheader', { name: columnMap[columnName] });
    await columnHeader.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Click to next page in pagination
   */
  async goToNextPage() {
    await this.nextPageButton.click();
    await this.waitForTableLoad();
  }

  /**
   * Click to previous page in pagination
   */
  async goToPreviousPage() {
    await this.previousPageButton.click();
    await this.waitForTableLoad();
  }

  /**
   * Change page size
   * @param size - Number of rows per page (10, 25, 50, 100)
   */
  async changePageSize(size: 10 | 25 | 50 | 100) {
    await this.pageSizeSelector.click();
    await this.page.getByRole('option', { name: String(size) }).click();
    await this.waitForTableLoad();
  }

  /**
   * Click the "Nova Unidade" button to open create form
   */
  async clickCreateButton() {
    await this.createButton.click();
    await this.sheetDialog.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Fill the clinic/hospital form
   * @param data - Form data
   */
  async fillClinicForm(data: {
    name: string;
    type?: 'clinic' | 'hospital';
    cnpj?: string;
    phone?: string;
    active?: boolean;
  }) {
    // Name (required)
    await this.nameInput.fill(data.name);

    // Type (optional, default is clinic)
    if (data.type) {
      await this.typeSelect.selectOption(data.type);
    }

    // CNPJ (optional)
    if (data.cnpj) {
      await this.cnpjInput.fill(data.cnpj);
    }

    // Phone (optional)
    if (data.phone) {
      await this.phoneInput.fill(data.phone);
    }

    // Active status (optional)
    if (data.active !== undefined) {
      const isChecked = await this.activeCheckbox.isChecked();
      if (data.active !== isChecked) {
        await this.activeCheckbox.click();
      }
    }
  }

  /**
   * Submit the clinic form
   */
  async submitForm() {
    await this.submitButton.click();
    // Wait for dialog to close
    await this.sheetDialog.waitFor({ state: 'hidden', timeout: 10000 });
    // Wait for table to update
    await this.waitForTableLoad();
  }

  /**
   * Cancel the form
   */
  async cancelForm() {
    await this.cancelButton.click();
    await this.sheetDialog.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Create a new clinic
   * @param data - Clinic data
   */
  async createClinic(data: {
    name: string;
    type?: 'clinic' | 'hospital';
    cnpj?: string;
    phone?: string;
    active?: boolean;
  }) {
    await this.clickCreateButton();
    await this.fillClinicForm(data);
    await this.submitForm();
  }

  /**
   * Open action menu for a specific clinic row
   * @param clinicName - Name of the clinic
   */
  async openActionMenu(clinicName: string) {
    const row = this.tableRows.filter({ hasText: clinicName });
    const actionButton = row.locator('button[aria-haspopup="menu"]');
    await actionButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Edit a clinic by name
   * @param clinicName - Name of the clinic to edit
   * @param newData - New data to update
   */
  async editClinic(
    clinicName: string,
    newData: {
      name?: string;
      type?: 'clinic' | 'hospital';
      cnpj?: string;
      phone?: string;
      active?: boolean;
    }
  ) {
    await this.openActionMenu(clinicName);
    await this.editMenuItem.click();
    await this.sheetDialog.waitFor({ state: 'visible', timeout: 5000 });

    // Fill only the fields that are provided
    if (newData.name) await this.nameInput.fill(newData.name);
    if (newData.type) await this.typeSelect.selectOption(newData.type);
    if (newData.cnpj !== undefined) await this.cnpjInput.fill(newData.cnpj);
    if (newData.phone !== undefined) await this.phoneInput.fill(newData.phone);
    if (newData.active !== undefined) {
      const isChecked = await this.activeCheckbox.isChecked();
      if (newData.active !== isChecked) {
        await this.activeCheckbox.click();
      }
    }

    await this.submitForm();
  }

  /**
   * Delete a clinic by name
   * @param clinicName - Name of the clinic to delete
   * @param confirm - Whether to confirm the deletion (default: true)
   */
  async deleteClinic(clinicName: string, confirm: boolean = true) {
    await this.openActionMenu(clinicName);

    // Set up dialog handler before clicking delete
    this.page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      if (confirm) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
    });

    await this.deleteMenuItem.click();

    if (confirm) {
      await this.waitForTableLoad();
    }
  }

  /**
   * Get the number of visible rows in the table
   */
  async getRowCount(): Promise<number> {
    await this.page.waitForTimeout(300);
    return await this.tableRows.count();
  }

  /**
   * Check if a clinic exists in the table by name
   * @param clinicName - Name of the clinic
   */
  async hasClinic(clinicName: string): Promise<boolean> {
    const row = this.tableRows.filter({ hasText: clinicName });
    return (await row.count()) > 0;
  }

  /**
   * Verify clinic exists in table
   * @param clinicName - Name of the clinic
   */
  async expectClinicVisible(clinicName: string) {
    const row = this.tableRows.filter({ hasText: clinicName });
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify clinic does not exist in table
   * @param clinicName - Name of the clinic
   */
  async expectClinicNotVisible(clinicName: string) {
    const row = this.tableRows.filter({ hasText: clinicName });
    await expect(row).not.toBeVisible();
  }

  /**
   * Verify table is empty
   */
  async expectTableEmpty() {
    await expect(this.emptyMessage).toBeVisible();
  }

  /**
   * Verify table is not empty
   */
  async expectTableNotEmpty() {
    await expect(this.tableRows.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify search input contains specific text
   */
  async expectSearchValue(value: string) {
    await expect(this.searchInput).toHaveValue(value);
  }

  /**
   * Verify specific number of rows
   */
  async expectRowCount(count: number) {
    await this.page.waitForTimeout(500);
    await expect(this.tableRows).toHaveCount(count);
  }

  /**
   * Verify pagination info shows correct page
   */
  async expectPageInfo(currentPage: number, totalPages: number) {
    const pattern = new RegExp(`página\\s+${currentPage}\\s+de\\s+${totalPages}`, 'i');
    await expect(this.paginationInfo).toContainText(pattern);
  }

  /**
   * Verify next page button state
   */
  async expectNextPageEnabled(enabled: boolean) {
    if (enabled) {
      await expect(this.nextPageButton).toBeEnabled();
    } else {
      await expect(this.nextPageButton).toBeDisabled();
    }
  }

  /**
   * Verify previous page button state
   */
  async expectPreviousPageEnabled(enabled: boolean) {
    if (enabled) {
      await expect(this.previousPageButton).toBeEnabled();
    } else {
      await expect(this.previousPageButton).toBeDisabled();
    }
  }

  /**
   * Get clinic data from a table row
   * @param clinicName - Name of the clinic
   */
  async getClinicData(clinicName: string): Promise<{
    name: string;
    type: string;
    status: string;
  }> {
    const row = this.tableRows.filter({ hasText: clinicName }).first();

    const name = await row.locator('td').first().textContent();
    const typeBadge = await row.locator('span').filter({ hasText: /clínica|hospital/i }).textContent();
    const statusBadge = await row.locator('span').filter({ hasText: /ativa|inativa/i }).textContent();

    return {
      name: name?.trim() || '',
      type: typeBadge?.trim() || '',
      status: statusBadge?.trim() || '',
    };
  }

  /**
   * Verify clinic row contains expected data
   */
  async expectClinicData(
    clinicName: string,
    expected: {
      type?: 'Clínica' | 'Hospital';
      status?: 'Ativa' | 'Inativa';
      phone?: string;
    }
  ) {
    const row = this.tableRows.filter({ hasText: clinicName }).first();
    await expect(row).toBeVisible();

    if (expected.type) {
      await expect(row).toContainText(expected.type);
    }

    if (expected.status) {
      await expect(row).toContainText(expected.status);
    }

    if (expected.phone) {
      await expect(row).toContainText(expected.phone);
    }
  }

  /**
   * Take a screenshot of the table
   * @param name - Name for the screenshot file
   */
  async screenshot(name: string) {
    await this.table.screenshot({ path: `screenshots/clinicas-${name}.png` });
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
   * Refresh the page
   */
  async refresh() {
    await this.page.reload();
    await this.waitForTableLoad();
  }

  /**
   * Navigate back in browser history
   */
  async goBack() {
    await this.page.goBack();
    await this.waitForTableLoad();
  }

  /**
   * Navigate forward in browser history
   */
  async goForward() {
    await this.page.goForward();
    await this.waitForTableLoad();
  }
}
