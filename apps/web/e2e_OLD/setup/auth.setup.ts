import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Authentication Setup for Playwright Tests
 *
 * This global setup script runs once before all tests to:
 * 1. Log in with test credentials
 * 2. Wait for Supabase authentication to complete
 * 3. Save the authenticated session to a file
 * 4. Reuse this session across all tests to avoid repeated logins
 *
 * The authentication state is saved to `.auth/user.json` and loaded
 * by test projects via the `storageState` configuration option.
 */

const authFile = path.join(__dirname, '../../.auth/user.json');

/**
 * Test credentials for e2e_OLD testing
 * These credentials are provided in the feature requirements
 */
const TEST_USER = {
  email: 'ths.pereira@gmail.com',
  password: 'Qsesbs2006',
};

setup('authenticate', async ({ page }) => {
  console.log('🔐 Starting authentication setup...');

  // Navigate to login page
  await page.goto('/login');

  // Check if we're already on the dashboard (already logged in via redirect)
  const currentUrl = page.url();
  if (currentUrl.includes('/dashboard')) {
    console.log('✅ Already authenticated, saving session...');
    await page.context().storageState({ path: authFile });
    return;
  }

  // Wait for login page to load
  await page.waitForLoadState('networkidle');

  console.log('📝 Filling login form...');

  // Fill in login credentials
  // Assuming the login form has email and password fields
  // Adjust selectors based on actual login form structure
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible({ timeout: 10000 });

  await emailInput.fill(TEST_USER.email);
  await passwordInput.fill(TEST_USER.password);

  console.log('🚀 Submitting login form...');

  // Submit the form
  // Look for submit button with common patterns
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();

  console.log('⏳ Waiting for authentication to complete...');

  // Wait for navigation after login (may redirect to / or /dashboard)
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  console.log('✅ Authentication successful!');

  // Verify we're actually authenticated by checking for user menu
  // The app shows a user menu button when authenticated
  await expect(page.getByRole('button', { name: /menu do usuário/i })).toBeVisible({
    timeout: 10000,
  });

  console.log('💾 Saving authentication state...');

  // Save signed-in state to '.auth/user.json'
  await page.context().storageState({ path: authFile });

  console.log('✅ Authentication setup complete!');
  console.log(`📁 Session saved to: ${authFile}`);
});
