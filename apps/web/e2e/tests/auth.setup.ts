import { test as setup, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * Setup de Autenticação
 *
 * Este arquivo faz login UMA VEZ e salva o estado de autenticação.
 * Os outros testes reutilizam esse estado (cookies, localStorage, sessionStorage).
 *
 * CONFIGURAÇÃO:
 * 1. Crie um arquivo .env.test na raiz do projeto
 * 2. Defina TEST_USER_EMAIL e TEST_USER_PASSWORD
 * 3. Ajuste os seletores abaixo conforme sua tela de login
 */
setup('authenticate', async ({ page }) => {
  // Verificar se as credenciais estão configuradas
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn('⚠️  Credenciais de teste não configuradas!');
    console.warn('   Crie um arquivo .env.test com:');
    console.warn('   TEST_USER_EMAIL=seu-email@teste.com');
    console.warn('   TEST_USER_PASSWORD=sua-senha-teste');
    console.warn('');
    console.warn('   Pulando autenticação...');

    // Salva estado vazio (testes rodarão sem auth)
    await page.context().storageState({ path: authFile });
    return;
  }

  console.log('🔐 Iniciando autenticação...');

  // Navegar para página de login
  // TODO: Ajuste a URL conforme seu projeto
  await page.goto('/login');

  // Aguardar a página carregar
  await page.waitForLoadState('networkidle');

  // Preencher formulário de login
  // TODO: Ajuste os seletores conforme sua tela de login
  await page.fill('input[name="email"], input[type="email"], #email', email);
  await page.fill('input[name="password"], input[type="password"], #password', password);

  // Clicar no botão de login
  // TODO: Ajuste o seletor conforme seu botão
  await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")');

  // Aguardar redirecionamento após login bem-sucedido
  // TODO: Ajuste a URL de destino conforme seu projeto
  await page.waitForURL('**/dashboard**', { timeout: 30000 }).catch(async () => {
    // Se não redirecionou para dashboard, pode ser outra página
    // Verificar se não estamos mais na página de login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Ainda na página de login - verificar se há erro
      const errorMessage = await page.locator('[role="alert"], .error, .toast-error').textContent().catch(() => null);
      throw new Error(`Login falhou. URL atual: ${currentUrl}. Erro: ${errorMessage || 'desconhecido'}`);
    }
    console.log(`✓ Login bem-sucedido. URL atual: ${currentUrl}`);
  });

  // Salvar estado de autenticação
  await page.context().storageState({ path: authFile });

  console.log('✓ Autenticação concluída e estado salvo');
});
