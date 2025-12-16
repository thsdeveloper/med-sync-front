# MedSync E2E Testing Documentation

This directory contains end-to-end (e2e) tests for the MedSync web application using [Playwright](https://playwright.dev/).

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Test Credentials Management](#test-credentials-management)
- [CI/CD Integration](#cicd-integration)
- [Writing Tests](#writing-tests)
- [Debugging Tests](#debugging-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

The e2e test suite provides automated testing for critical user workflows in the MedSync application. Currently, the test suite focuses on the **Calendar (Escalas)** functionality with comprehensive coverage of:

- **Date navigation controls** (Hoje/Anterior/Próximo buttons)
- **Month and year selectors** (interactive dropdowns)
- **View mode switching** (Mês/Semana/Dia/Agenda)
- **Combined filter scenarios** (navigation + selectors + view modes)
- **URL state persistence** (browser history, page refresh)
- **Edge cases** (leap years, month boundaries, rapid clicks)

### Test Coverage

| Feature | Test File | Test Count | Status |
|---------|-----------|------------|--------|
| Date Navigation | `calendar-navigation.spec.ts` | 50+ | ✅ Complete |
| Month/Year Selectors | `calendar-month-year-selectors.spec.ts` | 35+ | ✅ Complete |
| View Modes | `calendar-view-modes.spec.ts` | 24+ | ✅ Complete |
| Combined Filters | `calendar-combined-filters.spec.ts` | 30+ | ✅ Complete |

**Total Test Cases**: 140+ comprehensive e2e tests

---

## Test Structure

```
apps/web/e2e/
├── README.md                          # This file
├── setup/
│   └── auth.setup.ts                  # Authentication setup (runs before all tests)
├── fixtures/
│   └── calendar.fixtures.ts           # Custom test fixtures (CalendarPage)
├── pages/
│   └── CalendarPage.ts                # Page Object Model for Calendar page
└── calendar/
    ├── calendar-navigation.spec.ts    # Date navigation tests
    ├── calendar-month-year-selectors.spec.ts  # Month/year selector tests
    ├── calendar-view-modes.spec.ts    # View mode switching tests
    └── calendar-combined-filters.spec.ts      # Combined filter scenario tests
```

### Key Components

1. **Setup Scripts** (`setup/auth.setup.ts`)
   - Handles user authentication before running tests
   - Saves authentication state to `.auth/user.json`
   - Prevents login on every test run (performance optimization)

2. **Page Objects** (`pages/CalendarPage.ts`)
   - Encapsulates calendar page interactions
   - Provides reusable methods for common actions
   - Improves test maintainability

3. **Fixtures** (`fixtures/calendar.fixtures.ts`)
   - Extends base Playwright test with custom fixtures
   - Automatically provides `calendarPage` object to tests
   - Simplifies test setup and teardown

4. **Test Specs** (`calendar/*.spec.ts`)
   - Organized by feature area
   - Uses descriptive `test.describe()` blocks
   - Contains comprehensive test cases with edge cases

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Supabase project with test database
- Test user account in Supabase

### Installation

1. **Install dependencies** (from monorepo root):
   ```bash
   pnpm install
   ```

2. **Install Playwright browsers**:
   ```bash
   cd apps/web
   pnpm exec playwright install
   ```

   Or install with system dependencies (Linux):
   ```bash
   pnpm exec playwright install --with-deps
   ```

3. **Create test environment file**:
   ```bash
   cp .env.test.example .env.test
   ```

4. **Configure test credentials** (see [Test Credentials Management](#test-credentials-management))

---

## Running Tests

### Local Development

All commands should be run from the `apps/web` directory:

```bash
cd apps/web
```

#### Run all tests (headless mode)
```bash
pnpm test:e2e
```

#### Run tests with UI mode (recommended for development)
```bash
pnpm test:e2e:ui
```

#### Run tests in headed mode (see browser)
```bash
pnpm test:e2e:headed
```

#### Run tests in debug mode (step-through)
```bash
pnpm test:e2e:debug
```

#### View test report (after running tests)
```bash
pnpm test:e2e:report
```

#### Run specific test file
```bash
pnpm exec playwright test calendar-navigation.spec.ts
```

#### Run specific test by name
```bash
pnpm exec playwright test --grep "Hoje button"
```

### From Monorepo Root

You can also run tests from the monorepo root using pnpm filters:

```bash
# Run all e2e tests
pnpm --filter @medsync/web test:e2e

# Run tests with UI
pnpm --filter @medsync/web test:e2e:ui

# View report
pnpm --filter @medsync/web test:e2e:report
```

### Test Execution Options

Playwright provides many command-line options:

```bash
# Run tests on specific browser
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit

# Run tests in parallel (default)
pnpm exec playwright test --workers=4

# Run tests sequentially
pnpm exec playwright test --workers=1

# Update snapshots (if using visual regression)
pnpm exec playwright test --update-snapshots

# Show browser console output
pnpm exec playwright test --trace=on
```

---

## Test Credentials Management

### Local Development

For local development, test credentials are stored in `.env.test`:

```bash
# apps/web/.env.test
PLAYWRIGHT_BASE_URL=http://localhost:3000

# Test user credentials
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=YourSecurePassword123

# Supabase configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=your-bucket-name
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**⚠️ IMPORTANT**: Never commit `.env.test` with real credentials to version control!

### Creating a Test User

1. **Access Supabase Dashboard**:
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** → **Users**

2. **Create test user**:
   - Click "Add User"
   - Email: Choose a dedicated test user email (e.g., `test@yourcompany.com`)
   - Password: Set a secure password (min 6 characters)
   - Auto Confirm User: ✅ Enable (skip email confirmation)

3. **Assign proper role** (if using Row Level Security):
   - Ensure test user has necessary permissions to view calendar data
   - Add test user to appropriate organization/facility in your database

4. **Update `.env.test`**:
   ```bash
   TEST_USER_EMAIL=test@yourcompany.com
   TEST_USER_PASSWORD=YourSecurePassword123
   ```

### Best Practices for Test Users

- **Dedicated test account**: Use a separate user account specifically for testing
- **Stable data**: Ensure test user has access to stable test data (not production data)
- **Permissions**: Test user should have typical user permissions (not admin)
- **Isolation**: Test user should not interfere with production users or data

---

## CI/CD Integration

The e2e test suite is integrated into the CI/CD pipeline using GitHub Actions.

### GitHub Actions Workflow

The workflow file is located at `.github/workflows/e2e-tests.yml` and runs on:

- **Push** to `main` or `develop` branches
- **Pull requests** targeting `main` or `develop`
- **Manual trigger** via GitHub Actions UI

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings (**Settings** → **Secrets and variables** → **Actions** → **New repository secret**):

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `TEST_USER_EMAIL` | Test user email address | `test@yourcompany.com` |
| `TEST_USER_PASSWORD` | Test user password | `YourSecurePassword123` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Storage bucket name | `med-sync-bucket` |

### CI Workflow Steps

1. **Checkout code**: Clone repository
2. **Setup Node.js and pnpm**: Install build tools
3. **Install dependencies**: Run `pnpm install`
4. **Install Playwright browsers**: Install Chromium, Firefox, WebKit
5. **Build application**: Run `pnpm build`
6. **Create `.env.test`**: Inject secrets into environment file
7. **Run tests**: Execute `pnpm test:e2e` in headless mode
8. **Upload artifacts**: Save test results, reports, and traces
9. **Comment on PR**: Post test results to pull request (on PRs only)

### Viewing CI Test Results

After a workflow run completes:

1. **Go to Actions tab** in your GitHub repository
2. **Click on the workflow run** you want to inspect
3. **Download artifacts**:
   - `playwright-results`: Raw test results (JSON, XML)
   - `playwright-report`: HTML test report (open `index.html`)
   - `playwright-traces`: Traces for failed tests (view in Playwright Trace Viewer)

4. **View trace files**:
   ```bash
   # Download trace zip and view locally
   pnpm exec playwright show-trace path/to/trace.zip
   ```

### CI-Specific Configuration

The Playwright config (`playwright.config.ts`) has CI-specific settings:

```typescript
export default defineConfig({
  // Fail build if test.only is accidentally left in code
  forbidOnly: !!process.env.CI,

  // Retry failed tests twice on CI (0 retries locally)
  retries: process.env.CI ? 2 : 0,

  // Run tests sequentially on CI (parallel locally)
  workers: process.env.CI ? 1 : undefined,

  // Use screenshots and videos only on failure
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  // Start dev server before tests (reuse if already running locally)
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Writing Tests

### Page Object Model Pattern

All tests use the **Page Object Model (POM)** pattern for maintainability:

```typescript
// apps/web/e2e/pages/CalendarPage.ts
export class CalendarPage {
  constructor(public readonly page: Page) {}

  // Locators
  readonly hojeButton = this.page.getByRole('button', { name: /hoje/i });
  readonly calendarGrid = this.page.locator('.rbc-calendar').first();

  // Actions
  async clickHoje() {
    await this.hojeButton.click();
  }

  // Assertions
  async expectDisplayedDateContains(expectedText: string) {
    await expect(this.currentDateLabel).toContainText(expectedText);
  }
}
```

### Using Calendar Fixtures

Tests automatically receive a `calendarPage` fixture:

```typescript
import { test, expect } from '../fixtures/calendar.fixtures';

test.describe('Calendar Navigation', () => {
  test('navigates to today when Hoje button is clicked', async ({ calendarPage }) => {
    // Navigate to calendar page
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();

    // Click Hoje button
    await calendarPage.clickHoje();

    // Verify date changed
    const today = new Date();
    const expectedMonth = format(today, 'MMMM', { locale: ptBR });
    await calendarPage.expectDisplayedDateContains(expectedMonth);
  });
});
```

### Best Practices

1. **Use Page Objects**: Encapsulate all page interactions in `CalendarPage` class
2. **Descriptive test names**: Test names should clearly describe what is being tested
3. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification steps
4. **Wait for stability**: Always call `waitForCalendarLoad()` before interacting with calendar
5. **Explicit waits**: Use `waitFor()` instead of arbitrary `setTimeout()`
6. **Isolated tests**: Each test should be independent and not rely on previous test state
7. **Clean up**: Reset filters/state at the start of each test if needed
8. **Avoid hardcoding**: Use date-fns functions instead of hardcoded dates

### Example Test Structure

```typescript
test.describe('Feature Area - Specific Functionality', () => {
  test('should do something when user performs action', async ({ calendarPage }) => {
    // ARRANGE: Set up test conditions
    await calendarPage.goto();
    await calendarPage.waitForCalendarLoad();

    // ACT: Perform the action being tested
    await calendarPage.clickSomeButton();

    // ASSERT: Verify expected outcome
    await calendarPage.expectSomeCondition();
  });
});
```

---

## Debugging Tests

### Playwright Inspector (Recommended)

Run tests in debug mode to step through tests line-by-line:

```bash
pnpm test:e2e:debug
```

This opens the **Playwright Inspector** where you can:
- Step through test execution
- Inspect page elements
- View console logs
- Take screenshots
- Record videos

### UI Mode (Interactive)

Run tests in UI mode for visual debugging:

```bash
pnpm test:e2e:ui
```

UI mode provides:
- Live test execution preview
- Time travel debugging (click through test steps)
- Watch mode (re-run tests on file changes)
- Error highlighting
- Network request inspection

### Headed Mode (Visual Debugging)

Run tests with visible browser windows:

```bash
pnpm test:e2e:headed
```

### Playwright Trace Viewer

View trace files from failed tests:

```bash
# After running tests, view trace
pnpm exec playwright show-trace test-results/path-to-trace.zip
```

Trace viewer shows:
- DOM snapshots at each step
- Network requests
- Console logs
- Screenshots
- Timeline of actions

### VSCode Extension

Install the [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension:

- Run individual tests from editor
- Set breakpoints in test code
- View test results inline
- Debug with VSCode debugger

---

## Best Practices

### Test Organization

- **Group related tests**: Use `test.describe()` blocks to organize tests by feature
- **One assertion per test**: Each test should verify one specific behavior
- **Descriptive names**: Test names should explain what is being tested and expected outcome
- **Edge cases**: Always include edge case tests (boundaries, empty states, errors)

### Performance

- **Minimize navigation**: Reuse page state when possible
- **Parallel execution**: Run independent tests in parallel (default behavior)
- **Selective test runs**: Use `--grep` to run specific test groups during development
- **Authentication state**: Setup script saves auth state to avoid logging in for each test

### Reliability

- **Wait for stability**: Use `waitForCalendarLoad()` helper before interacting with calendar
- **Auto-retrying assertions**: Use Playwright's built-in `expect()` which retries automatically
- **Avoid hardcoded waits**: Don't use `page.waitForTimeout()` unless absolutely necessary
- **Locator best practices**: Prefer role-based and accessible selectors over CSS selectors

### Maintainability

- **Page Object Model**: Keep all selectors and actions in page objects
- **DRY principle**: Extract common test logic into helper methods
- **TypeScript**: Use strong typing for better IDE support and error detection
- **Documentation**: Add comments for complex test logic or edge cases

---

## Troubleshooting

### Common Issues

#### 1. Authentication Fails

**Error**: `Test user credentials not found in environment variables`

**Solution**:
- Ensure `.env.test` file exists in `apps/web/`
- Verify `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are set correctly
- Check that test user exists in Supabase Authentication

#### 2. Calendar Not Loading

**Error**: `Timeout waiting for calendar to load`

**Solution**:
- Ensure dev server is running (`pnpm dev` from `apps/web/`)
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Verify test user has access to calendar data (check RLS policies)
- Look for JavaScript errors in browser console

#### 3. Browsers Not Installed

**Error**: `Executable doesn't exist at /path/to/browser`

**Solution**:
```bash
pnpm exec playwright install
# Or with system dependencies
pnpm exec playwright install --with-deps
```

#### 4. Tests Fail in CI but Pass Locally

**Possible causes**:
- Missing environment variables (check GitHub Secrets)
- Different Node.js versions (CI uses Node 20)
- Race conditions (CI runs sequentially with `workers: 1`)
- Network latency differences

**Solution**:
- Run tests locally with `CI=true pnpm test:e2e` to simulate CI environment
- Check CI logs for specific error messages
- Download and inspect trace files from CI artifacts

#### 5. Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
- Stop existing Next.js dev server
- Or change `PLAYWRIGHT_BASE_URL` in `.env.test` to a different port
- Or update `playwright.config.ts` webServer port

### Debug Logging

Enable verbose logging in tests:

```typescript
test('debug test', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // Enable request logging
  page.on('request', req => console.log('REQUEST:', req.url()));

  // Enable response logging
  page.on('response', res => console.log('RESPONSE:', res.status(), res.url()));

  // Your test code...
});
```

### Getting Help

- **Playwright Documentation**: https://playwright.dev/docs/intro
- **Playwright Discord**: https://aka.ms/playwright/discord
- **Project Issues**: Open an issue in this repository with test logs and traces

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)
- [Trace Viewer](https://playwright.dev/docs/trace-viewer)

---

## Test Maintenance

### Adding New Tests

When adding new calendar functionality, create corresponding e2e tests:

1. **Create test file**: `apps/web/e2e/calendar/new-feature.spec.ts`
2. **Add page object methods**: Update `CalendarPage.ts` with new locators/actions
3. **Write comprehensive tests**: Include happy path, edge cases, and error scenarios
4. **Update this README**: Document new test coverage in the table above

### Updating Tests

When calendar functionality changes:

1. **Update page objects first**: Fix broken locators in `CalendarPage.ts`
2. **Run tests**: Identify failing tests
3. **Update test expectations**: Fix assertions to match new behavior
4. **Add regression tests**: Prevent the bug from happening again

### Test Review Checklist

Before merging new tests, verify:

- [ ] Tests pass locally in all browsers (chromium, firefox, webkit)
- [ ] Tests are properly organized with `test.describe()` blocks
- [ ] Test names are descriptive and explain expected behavior
- [ ] Page Object Model is used (no direct selectors in tests)
- [ ] Edge cases are covered
- [ ] Tests are independent (no shared state between tests)
- [ ] Waits are explicit (no arbitrary timeouts)
- [ ] Documentation is updated (this README)

---

**Last Updated**: December 2025
**Playwright Version**: 1.49.0
**Test Coverage**: 140+ tests across calendar functionality
