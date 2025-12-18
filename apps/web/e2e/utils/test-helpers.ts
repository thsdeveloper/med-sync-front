import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Aguarda a aplicação estar pronta
 */
export async function waitForApp(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');

  const loadingSelectors = ['[data-loading="true"]', '.loading', '.spinner', '[aria-busy="true"]'];

  for (const selector of loadingSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      await page.locator(selector).first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    }
  }
}

/**
 * Captura screenshot com nome padronizado
 */
export async function captureScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean }
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join('e2e/reports/screenshots', filename);

  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await page.screenshot({
    path: filepath,
    fullPage: options?.fullPage ?? true,
  });

  return filepath;
}

/**
 * Coleta erros de console
 */
export function setupConsoleErrorCollection(page: Page): string[] {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(`[PageError] ${error.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[Console] ${msg.text()}`);
  });

  return errors;
}

/**
 * Verifica erros de console
 */
export function checkConsoleErrors(errors: string[]): void {
  if (errors.length > 0) {
    throw new Error(`Console errors detected:\n${errors.join('\n')}`);
  }
}

/**
 * Preenche campo de formulário
 */
export async function fillField(page: Page, selector: string, value: string): Promise<void> {
  const field = page.locator(selector);
  await field.click();
  await field.fill('');
  await field.fill(value);
}

/**
 * Gera dados de teste
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@example.com`,
    name: `Test User ${timestamp}`,
    password: `TestPass${timestamp}!`,
  };
}
