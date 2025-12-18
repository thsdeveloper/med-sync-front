import { test, expect } from '@playwright/test';

/**
 * Testes da página de login
 * Estes testes NÃO precisam de autenticação (usam o projeto chromium-no-auth)
 *
 * Nomenclatura: *.public.spec.ts ou *.noauth.spec.ts
 */
test.describe('Página de Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('deve exibir formulário de login', async ({ page }) => {
    // Verificar que os campos existem
    await expect(page.locator('input[type="email"], input[name="email"], #email')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"], #password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('deve mostrar erro para credenciais inválidas', async ({ page }) => {
    // Preencher com credenciais inválidas
    await page.fill('input[type="email"], input[name="email"], #email', 'invalido@teste.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'senha-errada');

    // Submeter formulário
    await page.click('button[type="submit"]');

    // Aguardar mensagem de erro
    // TODO: Ajuste o seletor conforme seu componente de erro
    const errorLocator = page.locator('[role="alert"], .error, .toast-error, [data-testid="error"]');
    await expect(errorLocator).toBeVisible({ timeout: 10000 });
  });

  test('deve validar email obrigatório', async ({ page }) => {
    // Tentar submeter sem email
    await page.fill('input[type="password"], input[name="password"], #password', 'qualquer-senha');
    await page.click('button[type="submit"]');

    // Verificar validação
    const emailInput = page.locator('input[type="email"], input[name="email"], #email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('screenshot da página de login', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/reports/screenshots/login-page.png',
      fullPage: true,
    });
  });
});
