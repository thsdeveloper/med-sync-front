import { test, expect } from '@playwright/test';

/**
 * Testes de saúde (health check)
 * Verifica se a aplicação está funcionando corretamente
 */
test.describe('Health Check', () => {
  test('aplicação carrega sem erros HTTP', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(400);
  });

  test('aplicação carrega sem erros de console críticos', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('screenshot da página inicial', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'e2e/reports/screenshots/home.png',
      fullPage: true,
    });
  });

  test('página tem título', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe('Performance Básica', () => {
  test('página carrega em tempo aceitável', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000);
  });
});
