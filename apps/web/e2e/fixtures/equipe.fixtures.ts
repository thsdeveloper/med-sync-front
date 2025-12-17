import { test as base } from '@playwright/test';
import { EquipePage } from '../pages/EquipePage';

/**
 * Extended Playwright test with custom fixtures for Equipe (Medical Staff) page
 *
 * Usage:
 * ```typescript
 * import { test, expect } from './fixtures/equipe.fixtures';
 *
 * test('should display equipe table', async ({ equipePage }) => {
 *   await equipePage.goto();
 *   await equipePage.expectOnEquipePage();
 * });
 * ```
 */
type EquipeFixtures = {
  equipePage: EquipePage;
};

export const test = base.extend<EquipeFixtures>({
  equipePage: async ({ page }, use) => {
    const equipePage = new EquipePage(page);
    await use(equipePage);
  },
});

export { expect } from '@playwright/test';
