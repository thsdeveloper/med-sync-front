import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega variáveis de ambiente do .env.test se existir
dotenv.config({ path: '.env.test' });
dotenv.config(); // fallback para .env

// Caminho para o storage state de autenticação
const authFile = path.join(__dirname, 'e2e/.auth/user.json');

/**
 * Configuração do Playwright para testes e2e
 * Gerado pelo Dev Agent Harness
 *
 * AUTENTICAÇÃO:
 * - O projeto 'setup' faz login e salva o estado em e2e/.auth/user.json
 * - Os outros projetos reutilizam esse estado (já autenticados)
 * - Configure as credenciais em .env.test
 *
 * @see https://playwright.dev/docs/test-configuration
 * @see https://playwright.dev/docs/auth
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: './e2e/reports/html' }],
    ['json', { outputFile: './e2e/reports/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  timeout: 60000,
  expect: {
    timeout: 5000,
  },
  projects: [
    // Setup project - faz login e salva estado de autenticação
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Testes que NÃO precisam de autenticação
    {
      name: 'chromium-no-auth',
      testMatch: /.*\.(noauth|public)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Testes que PRECISAM de autenticação (maioria)
    {
      name: 'chromium',
      testIgnore: /.*\.(setup|noauth|public)\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Reutiliza o estado de autenticação salvo pelo setup
        storageState: authFile,
      },
    },
  ],
  outputDir: './e2e/reports/test-results',
});
