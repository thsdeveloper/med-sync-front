import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Equipe (Medical Staff) table page
 * Location: /dashboard/equipe
 *
 * This page allows users to:
 * - View medical staff members linked to their organization
 * - Search staff by name
 * - Filter by role (Médico, Enfermeiro, Técnico de Enfermagem, etc.)
 * - Filter by especialidade (using especialidades table foreign key)
 * - Filter by status (active/inactive)
 * - Sort by multiple columns (name, especialidade, role, status, created_at)
 * - Paginate through results (10, 25, 50, 100 per page)
 * - Create new staff members with especialidade selection
 * - Edit existing staff members
 * - Unlink staff members from organization (soft delete)
 */
export class EquipePage {
  readonly page: Page;

  // ============================================
  // Main Page Locators
  // ============================================
  readonly pageHeading: Locator;
  readonly addButton: Locator;
  readonly table: Locator;
  readonly tableRows: Locator;

  // ============================================
  // Toolbar Locators (Search and Filters)
  // ============================================
  readonly searchInput: Locator;
  readonly searchClearButton: Locator;
  readonly viewOptionsButton: Locator;

  // TanStack Table Faceted Filters
  readonly roleFilterButton: Locator;
  readonly especialidadeFilterButton: Locator;
  readonly statusFilterButton: Locator;

  // ============================================
  // Pagination Locators
  // ============================================
  readonly paginationInfo: Locator;
  readonly previousPageButton: Locator;
  readonly nextPageButton: Locator;
  readonly pageSizeSelect: Locator;

  // ============================================
  // MedicalStaffSheet Form Locators
  // ============================================
  readonly formDialog: Locator;
  readonly formTitle: Locator;
  readonly nameInput: Locator;
  readonly roleSelect: Locator;
  readonly especialidadeCombobox: Locator;
  readonly especialidadeComboboxTrigger: Locator;
  readonly especialidadeComboboxSearch: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly statusCheckbox: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  // ============================================
  // Actions Menu Locators
  // ============================================
  readonly actionsMenuTrigger: Locator;
  readonly editAction: Locator;
  readonly unlinkAction: Locator;

  // ============================================
  // Confirmation Dialog Locators
  // ============================================
  readonly confirmDialog: Locator;
  readonly confirmDialogTitle: Locator;
  readonly confirmDialogDescription: Locator;
  readonly confirmButton: Locator;
  readonly cancelDialogButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main page elements
    this.pageHeading = page.getByRole('heading', { name: /equipe/i });
    this.addButton = page.getByRole('button', { name: /adicionar membro/i });
    this.table = page.locator('table').first();
    this.tableRows = this.table.locator('tbody tr');

    // Toolbar elements
    this.searchInput = page.getByPlaceholder(/buscar por nome/i);
    this.searchClearButton = page.getByRole('button', { name: /limpar/i });
    this.viewOptionsButton = page.getByRole('button', { name: /view/i });

    // Filter buttons (TanStack Table faceted filters)
    this.roleFilterButton = page.getByRole('button', { name: /função/i });
    this.especialidadeFilterButton = page.getByRole('button', { name: /especialidade/i });
    this.statusFilterButton = page.getByRole('button', { name: /status/i });

    // Pagination elements
    this.paginationInfo = page.locator('[class*="pagination"]').getByText(/de/);
    this.previousPageButton = page.getByRole('button', { name: /anterior/i });
    this.nextPageButton = page.getByRole('button', { name: /próxim/i });
    this.pageSizeSelect = page.locator('select[aria-label*="page size"], button:has-text("linhas")');

    // Form dialog elements
    this.formDialog = page.locator('[role="dialog"]');
    this.formTitle = this.formDialog.getByRole('heading');
    this.nameInput = this.formDialog.getByLabel(/nome/i);
    this.roleSelect = this.formDialog.getByLabel(/função/i);
    this.especialidadeCombobox = this.formDialog.locator('[role="combobox"]').first();
    this.especialidadeComboboxTrigger = this.formDialog.getByRole('button', { name: /selecione uma especialidade/i });
    this.especialidadeComboboxSearch = this.formDialog.getByPlaceholder(/buscar especialidade/i);
    this.phoneInput = this.formDialog.getByLabel(/telefone/i);
    this.emailInput = this.formDialog.getByLabel(/email/i);
    this.statusCheckbox = this.formDialog.getByLabel(/ativo/i);
    this.submitButton = this.formDialog.getByRole('button', { name: /salvar|criar/i });
    this.cancelButton = this.formDialog.getByRole('button', { name: /cancelar/i });

    // Actions menu elements
    this.actionsMenuTrigger = page.getByRole('button', { name: /abrir menu|actions/i }).first();
    this.editAction = page.getByRole('menuitem', { name: /editar/i });
    this.unlinkAction = page.getByRole('menuitem', { name: /desvincular/i });

    // Confirmation dialog elements
    this.confirmDialog = page.locator('[role="alertdialog"]');
    this.confirmDialogTitle = this.confirmDialog.getByRole('heading');
    this.confirmDialogDescription = this.confirmDialog.locator('p').first();
    this.confirmButton = this.confirmDialog.getByRole('button', { name: /confirmar|desvincular/i });
    this.cancelDialogButton = this.confirmDialog.getByRole('button', { name: /cancelar/i });
  }

  // ============================================
  // Navigation Methods
  // ============================================

  /**
   * Navigate to the Equipe page
   */
  async goto() {
    await this.page.goto('/dashboard/equipe');
    await this.waitForTableLoad();
  }

  /**
   * Wait for the table to finish loading
   */
  async waitForTableLoad() {
    // Wait for page to be fully loaded
    await this.page.waitForLoadState('networkidle');
    // Wait for table to be visible
    await this.table.waitFor({ state: 'visible', timeout: 10000 });
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

  // ============================================
  // Search Methods
  // ============================================

  /**
   * Search for staff members by name
   */
  async searchStaff(name: string) {
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(500); // Debounce delay
    await this.waitForTableLoad();
  }

  /**
   * Clear the search input
   */
  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
    await this.waitForTableLoad();
  }

  // ============================================
  // Filter Methods
  // ============================================

  /**
   * Filter staff by role
   * @param role - Role to filter by (e.g., "Médico", "Enfermeiro")
   */
  async filterByRole(role: string) {
    await this.roleFilterButton.click();
    await this.page.waitForTimeout(300);

    // Find and click the role option in the dropdown
    const roleOption = this.page.getByRole('option', { name: role }).or(
      this.page.getByText(role, { exact: true })
    );
    await roleOption.click();

    await this.page.waitForTimeout(500);
    await this.waitForTableLoad();
  }

  /**
   * Filter staff by especialidade
   * @param especialidade - Especialidade to filter by (e.g., "Cardiologia")
   */
  async filterByEspecialidade(especialidade: string) {
    await this.especialidadeFilterButton.click();
    await this.page.waitForTimeout(300);

    // Find and click the especialidade option in the dropdown
    const especialidadeOption = this.page.getByRole('option', { name: especialidade }).or(
      this.page.getByText(especialidade, { exact: true })
    );
    await especialidadeOption.click();

    await this.page.waitForTimeout(500);
    await this.waitForTableLoad();
  }

  /**
   * Filter staff by status
   * @param status - Status to filter by ("Ativo" or "Inativo")
   */
  async filterByStatus(status: 'Ativo' | 'Inativo') {
    await this.statusFilterButton.click();
    await this.page.waitForTimeout(300);

    // Find and click the status option in the dropdown
    const statusOption = this.page.getByRole('option', { name: status }).or(
      this.page.getByText(status, { exact: true })
    );
    await statusOption.click();

    await this.page.waitForTimeout(500);
    await this.waitForTableLoad();
  }

  /**
   * Clear all active filters
   */
  async clearAllFilters() {
    // Look for "Clear filters" or "Limpar filtros" button
    const clearButton = this.page.getByRole('button', { name: /limpar filtros|clear filters/i });
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await this.page.waitForTimeout(500);
      await this.waitForTableLoad();
    }
  }

  // ============================================
  // Sorting Methods
  // ============================================

  /**
   * Sort table by column
   * @param columnName - Name of column to sort (e.g., "Nome", "Especialidade", "Função")
   */
  async sortByColumn(columnName: string) {
    const columnHeader = this.table.getByRole('columnheader', { name: new RegExp(columnName, 'i') });
    await columnHeader.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get current sort direction for a column
   * @param columnName - Name of column to check
   * @returns 'asc', 'desc', or null
   */
  async getSortDirection(columnName: string): Promise<'asc' | 'desc' | null> {
    const columnHeader = this.table.getByRole('columnheader', { name: new RegExp(columnName, 'i') });
    const ariaSort = await columnHeader.getAttribute('aria-sort');

    if (ariaSort === 'ascending') return 'asc';
    if (ariaSort === 'descending') return 'desc';
    return null;
  }

  // ============================================
  // Pagination Methods
  // ============================================

  /**
   * Go to next page
   */
  async goToNextPage() {
    await this.nextPageButton.click();
    await this.waitForTableLoad();
  }

  /**
   * Go to previous page
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
    await this.pageSizeSelect.click();
    await this.page.waitForTimeout(200);

    const option = this.page.getByRole('option', { name: String(size) }).or(
      this.page.getByText(String(size), { exact: true })
    );
    await option.click();

    await this.page.waitForTimeout(500);
    await this.waitForTableLoad();
  }

  /**
   * Get current pagination info text
   */
  async getPaginationInfo(): Promise<string> {
    return await this.paginationInfo.textContent() || '';
  }

  // ============================================
  // CRUD Methods
  // ============================================

  /**
   * Open the create staff member dialog
   */
  async openCreateDialog() {
    await this.addButton.click();
    await this.formDialog.waitFor({ state: 'visible' });
  }

  /**
   * Select especialidade from combobox
   * @param especialidadeName - Name of especialidade to select
   */
  async selectEspecialidade(especialidadeName: string) {
    // Click the combobox trigger button
    await this.especialidadeComboboxTrigger.click();
    await this.page.waitForTimeout(300);

    // Wait for the popover/command to appear
    const commandPopover = this.page.locator('[role="dialog"], [cmdk-root]').last();
    await commandPopover.waitFor({ state: 'visible', timeout: 5000 });

    // Search for the especialidade
    const searchInput = commandPopover.getByPlaceholder(/buscar especialidade/i).or(
      commandPopover.locator('input[type="text"]').first()
    );

    if (await searchInput.isVisible()) {
      await searchInput.fill(especialidadeName);
      await this.page.waitForTimeout(500);
    }

    // Click the option
    const option = commandPopover.getByRole('option', { name: new RegExp(especialidadeName, 'i') }).or(
      commandPopover.getByText(especialidadeName, { exact: false })
    );
    await option.click();

    await this.page.waitForTimeout(300);
  }

  /**
   * Fill the staff member form
   */
  async fillStaffForm(data: {
    name: string;
    role?: string;
    especialidade?: string;
    phone?: string;
    email?: string;
    active?: boolean;
  }) {
    // Fill name (required)
    await this.nameInput.fill(data.name);

    // Fill role if provided
    if (data.role) {
      await this.roleSelect.click();
      await this.page.waitForTimeout(200);
      const roleOption = this.page.getByRole('option', { name: data.role }).or(
        this.page.getByText(data.role, { exact: true })
      );
      await roleOption.click();
    }

    // Select especialidade if provided
    if (data.especialidade) {
      await this.selectEspecialidade(data.especialidade);
    }

    // Fill phone if provided
    if (data.phone) {
      await this.phoneInput.fill(data.phone);
    }

    // Fill email if provided
    if (data.email) {
      await this.emailInput.fill(data.email);
    }

    // Set active status if provided
    if (data.active !== undefined) {
      const isChecked = await this.statusCheckbox.isChecked();
      if (data.active !== isChecked) {
        await this.statusCheckbox.click();
      }
    }
  }

  /**
   * Submit the staff member form
   */
  async submitForm() {
    await this.submitButton.click();
    await this.formDialog.waitFor({ state: 'hidden', timeout: 10000 });
    await this.page.waitForTimeout(1000); // Wait for mutation to complete
    await this.waitForTableLoad();
  }

  /**
   * Cancel the staff member form
   */
  async cancelForm() {
    await this.cancelButton.click();
    await this.formDialog.waitFor({ state: 'hidden' });
  }

  /**
   * Create a new staff member
   */
  async createStaffMember(data: {
    name: string;
    role?: string;
    especialidade?: string;
    phone?: string;
    email?: string;
    active?: boolean;
  }) {
    await this.openCreateDialog();
    await this.fillStaffForm(data);
    await this.submitForm();
  }

  /**
   * Open edit dialog for a staff member by name
   */
  async openEditDialog(staffName: string) {
    const row = await this.findRowByName(staffName);
    if (!row) {
      throw new Error(`Staff member not found: ${staffName}`);
    }

    // Find actions button in the row
    const actionsButton = row.getByRole('button', { name: /abrir menu|actions/i });
    await actionsButton.click();
    await this.page.waitForTimeout(200);

    // Click edit action
    await this.editAction.click();
    await this.formDialog.waitFor({ state: 'visible' });
  }

  /**
   * Edit an existing staff member
   */
  async editStaffMember(currentName: string, newData: {
    name?: string;
    role?: string;
    especialidade?: string;
    phone?: string;
    email?: string;
    active?: boolean;
  }) {
    await this.openEditDialog(currentName);
    await this.fillStaffForm({
      name: newData.name || currentName,
      role: newData.role,
      especialidade: newData.especialidade,
      phone: newData.phone,
      email: newData.email,
      active: newData.active,
    });
    await this.submitForm();
  }

  /**
   * Unlink a staff member from the organization
   */
  async unlinkStaffMember(staffName: string, confirm: boolean = true) {
    const row = await this.findRowByName(staffName);
    if (!row) {
      throw new Error(`Staff member not found: ${staffName}`);
    }

    // Find actions button in the row
    const actionsButton = row.getByRole('button', { name: /abrir menu|actions/i });
    await actionsButton.click();
    await this.page.waitForTimeout(200);

    // Click unlink action
    await this.unlinkAction.click();
    await this.confirmDialog.waitFor({ state: 'visible' });

    if (confirm) {
      await this.confirmButton.click();
      await this.confirmDialog.waitFor({ state: 'hidden', timeout: 10000 });
      await this.page.waitForTimeout(1000); // Wait for mutation to complete
      await this.waitForTableLoad();
    } else {
      await this.cancelDialogButton.click();
      await this.confirmDialog.waitFor({ state: 'hidden' });
    }
  }

  // ============================================
  // Data Retrieval Methods
  // ============================================

  /**
   * Find a table row by staff member name
   */
  async findRowByName(name: string): Promise<Locator | null> {
    const rows = await this.tableRows.all();

    for (const row of rows) {
      const text = await row.textContent();
      if (text && text.includes(name)) {
        return row;
      }
    }

    return null;
  }

  /**
   * Get all visible staff member names
   */
  async getVisibleStaffNames(): Promise<string[]> {
    const rows = await this.tableRows.all();
    const names: string[] = [];

    for (const row of rows) {
      // Get the first cell (name column)
      const nameCell = row.locator('td').first();
      const text = await nameCell.textContent();
      if (text) {
        names.push(text.trim());
      }
    }

    return names;
  }

  /**
   * Get staff member data from a row
   */
  async getStaffData(name: string): Promise<{
    name: string;
    especialidade?: string;
    role?: string;
    contact?: string;
    status?: string;
  } | null> {
    const row = await this.findRowByName(name);
    if (!row) return null;

    const cells = await row.locator('td').all();

    return {
      name: (await cells[0]?.textContent())?.trim() || '',
      especialidade: (await cells[1]?.textContent())?.trim() || '',
      role: (await cells[2]?.textContent())?.trim() || '',
      contact: (await cells[3]?.textContent())?.trim() || '',
      status: (await cells[4]?.textContent())?.trim() || '',
    };
  }

  /**
   * Get current table row count
   */
  async getRowCount(): Promise<number> {
    const rows = await this.tableRows.all();
    // Filter out "no results" row if present
    const validRows = rows.filter(async (row) => {
      const text = await row.textContent();
      return text && !text.includes('Nenhum resultado');
    });
    return validRows.length;
  }

  /**
   * Check if table is empty
   */
  async isTableEmpty(): Promise<boolean> {
    const rowCount = await this.getRowCount();
    return rowCount === 0;
  }

  // ============================================
  // Assertion Helpers
  // ============================================

  /**
   * Assert that a staff member is visible in the table
   */
  async expectStaffVisible(name: string) {
    const row = await this.findRowByName(name);
    expect(row).not.toBeNull();
  }

  /**
   * Assert that a staff member is not visible in the table
   */
  async expectStaffNotVisible(name: string) {
    const row = await this.findRowByName(name);
    expect(row).toBeNull();
  }

  /**
   * Assert that the table is empty
   */
  async expectTableEmpty() {
    const isEmpty = await this.isTableEmpty();
    expect(isEmpty).toBe(true);
  }

  /**
   * Assert that the table has a specific number of rows
   */
  async expectRowCount(count: number) {
    const actualCount = await this.getRowCount();
    expect(actualCount).toBe(count);
  }

  /**
   * Assert that staff member data matches expected values
   */
  async expectStaffData(name: string, expectedData: {
    especialidade?: string;
    role?: string;
    status?: string;
  }) {
    const actualData = await this.getStaffData(name);
    expect(actualData).not.toBeNull();

    if (expectedData.especialidade) {
      expect(actualData?.especialidade).toContain(expectedData.especialidade);
    }
    if (expectedData.role) {
      expect(actualData?.role).toContain(expectedData.role);
    }
    if (expectedData.status) {
      expect(actualData?.status).toContain(expectedData.status);
    }
  }

  /**
   * Assert that especialidade is selected in form
   */
  async expectEspecialidadeSelected(especialidadeName: string) {
    const triggerText = await this.especialidadeComboboxTrigger.textContent();
    expect(triggerText).toContain(especialidadeName);
  }

  /**
   * Assert that the page is on the Equipe page
   */
  async expectOnEquipePage() {
    await expect(this.page).toHaveURL(/\/dashboard\/equipe/);
    await expect(this.pageHeading).toBeVisible();
  }
}
