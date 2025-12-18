import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface ScreenshotOptions {
  name: string;
  fullPage?: boolean;
}

/**
 * Fixture base com helpers para testes
 */
export const test = base.extend<{
  captureScreenshot: (options: ScreenshotOptions) => Promise<string>;
  waitForAppReady: () => Promise<void>;
  consoleErrors: string[];
}>({
  captureScreenshot: async ({ page }, use) => {
    const captureScreenshot = async (options: ScreenshotOptions): Promise<string> => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${options.name}-${timestamp}.png`;
      const filepath = path.join('e2e/reports/screenshots', filename);

      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await page.screenshot({
        path: filepath,
        fullPage: options.fullPage ?? true,
      });

      return filepath;
    };

    await use(captureScreenshot);
  },

  waitForAppReady: async ({ page }, use) => {
    const waitForAppReady = async (): Promise<void> => {
      await page.waitForLoadState('networkidle');

      const loadingSelectors = [
        '[data-loading="true"]',
        '.loading',
        '.spinner',
        '[aria-busy="true"]',
        '.skeleton',
      ];

      for (const selector of loadingSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          await elements.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        }
      }
    };

    await use(waitForAppReady);
  },

  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await use(errors);
  },
});

export { expect };
