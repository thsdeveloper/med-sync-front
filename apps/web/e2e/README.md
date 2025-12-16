# End-to-End Testing with Playwright

This directory contains end-to-end tests for the MedSync web application using [Playwright](https://playwright.dev/).

## 📁 Directory Structure

```
e2e/
├── setup/
│   └── auth.setup.ts         # Authentication setup (runs before all tests)
├── fixtures/
│   └── calendar.fixtures.ts  # Custom test fixtures for calendar tests
├── pages/
│   └── CalendarPage.ts       # Calendar page object model
├── calendar/
│   └── calendar-navigation.spec.ts  # Calendar navigation tests
└── README.md                 # This file
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd apps/web
pnpm install
```

This will install Playwright and all required dependencies.

### 2. Install Playwright Browsers

```bash
pnpm exec playwright install
```

This downloads the browser binaries (Chromium, Firefox, WebKit).

### 3. Set Up Environment Variables

The test environment is configured in `.env.test` with test credentials:

- **Email**: `ths.pereira@gmail.com`
- **Password**: `Qsesbs2006`

These credentials are used by the authentication setup script.

### 4. Start Development Server

Tests require the Next.js dev server to be running:

```bash
pnpm dev
```

The dev server will start on `http://localhost:3000`.

## 🧪 Running Tests

### Run All Tests (Headless)

```bash
pnpm test:e2e
```

### Run Tests with UI Mode (Interactive)

```bash
pnpm test:e2e:ui
```

UI mode provides a visual interface to:
- Watch tests run in real-time
- Debug test failures
- Inspect DOM and network activity
- Time-travel through test steps

### Run Tests in Headed Mode (See Browser)

```bash
pnpm test:e2e:headed
```

### Debug Tests

```bash
pnpm test:e2e:debug
```

This opens Playwright Inspector for step-by-step debugging.

### Run Specific Test File

```bash
pnpm exec playwright test e2e/calendar/calendar-navigation.spec.ts
```

### Run Tests in Specific Browser

```bash
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit
```

## 🔐 Authentication Flow

### How It Works

1. **Setup Phase** (`e2e/setup/auth.setup.ts`):
   - Runs once before all tests
   - Navigates to login page
   - Fills in test credentials
   - Waits for authentication to complete
   - Saves session to `.auth/user.json`

2. **Test Phase**:
   - Each test loads the saved session from `.auth/user.json`
   - No need to log in again
   - Tests can immediately access protected pages

### Session Storage

The authenticated session is stored in `.auth/user.json`:
- Contains cookies, localStorage, sessionStorage
- Automatically loaded by Playwright for all test projects
- Gitignored to avoid committing sensitive data
- Regenerated on each test run via setup script

### Benefits

✅ **Fast**: Login happens once, not for every test
✅ **Reliable**: No repeated login attempts that could trigger rate limits
✅ **Isolated**: Each test gets a fresh context with the same authentication

## 📄 Page Objects

### CalendarPage

The `CalendarPage` class provides a clean API for interacting with the calendar:

```typescript
import { test, expect } from '../fixtures/calendar.fixtures';

test('example calendar test', async ({ calendarPage }) => {
  // Navigate to calendar
  await calendarPage.goto();

  // Click navigation controls
  await calendarPage.clickToday();
  await calendarPage.clickNext();
  await calendarPage.clickPrevious();

  // Change view mode
  await calendarPage.changeView('week');
  await calendarPage.changeView('day');

  // Apply filters
  await calendarPage.filterByFacility('Hospital Central');
  await calendarPage.filterBySpecialty('Cardiologia');

  // Verify calendar is visible
  await calendarPage.expectCalendarVisible();
});
```

### Available Methods

| Method | Description |
|--------|-------------|
| `goto()` | Navigate to calendar page |
| `clickToday()` | Click "Hoje" button |
| `clickPrevious()` | Click "Anterior" button |
| `clickNext()` | Click "Próximo" button |
| `changeView(view)` | Switch view mode (month/week/day/agenda) |
| `selectMonth(month)` | Select specific month |
| `selectYear(year)` | Select specific year |
| `filterByFacility(name)` | Apply facility filter |
| `filterBySpecialty(name)` | Apply specialty filter |
| `expectCalendarVisible()` | Assert calendar is visible |
| `expectEventsVisible()` | Assert events are displayed |
| `getEventCount()` | Get number of visible events |
| `waitForCalendarLoad()` | Wait for calendar to finish loading |

## 🛠️ Writing New Tests

### 1. Use Custom Fixtures

Import test and expect from `calendar.fixtures.ts`:

```typescript
import { test, expect } from '../fixtures/calendar.fixtures';
```

This gives you access to the `calendarPage` fixture.

### 2. Follow Page Object Pattern

Use page objects instead of raw selectors:

```typescript
// ✅ Good - Using page object
await calendarPage.clickToday();

// ❌ Bad - Using raw selector
await page.click('button:has-text("Hoje")');
```

### 3. Wait for State Changes

Always wait for the calendar to finish loading:

```typescript
await calendarPage.changeView('week');
await calendarPage.waitForCalendarLoad();
```

### 4. Use Descriptive Test Names

```typescript
test('should maintain view mode when navigating dates', async ({ calendarPage }) => {
  // Test implementation
});
```

### 5. Group Related Tests

Use `test.describe()` to group related tests:

```typescript
test.describe('Calendar Filters', () => {
  test('should filter by facility', async ({ calendarPage }) => {
    // ...
  });

  test('should filter by specialty', async ({ calendarPage }) => {
    // ...
  });
});
```

## 📊 Test Reports

After running tests, you can view the HTML report:

```bash
pnpm exec playwright show-report
```

The report includes:
- Test results (passed/failed)
- Screenshots on failure
- Video recordings (if enabled)
- Trace files for debugging

## 🐛 Debugging Tips

### 1. Use Playwright Inspector

```bash
pnpm test:e2e:debug
```

Step through tests line by line, inspect the DOM, and view console logs.

### 2. Enable Trace Viewer

Traces are automatically captured on first retry. View them with:

```bash
pnpm exec playwright show-trace trace.zip
```

### 3. Add Console Logs

```typescript
test('debug test', async ({ page, calendarPage }) => {
  console.log('Current URL:', page.url());

  await calendarPage.goto();

  const eventCount = await calendarPage.getEventCount();
  console.log('Event count:', eventCount);
});
```

### 4. Take Screenshots

```typescript
await calendarPage.screenshot('after-navigation');
```

### 5. Pause Test Execution

```typescript
await page.pause();
```

## 📝 Best Practices

### ✅ Do:

- Use page objects for all interactions
- Wait for elements before interacting
- Use meaningful test names
- Group related tests with `describe()`
- Clean up test data after tests
- Use custom fixtures for common setup

### ❌ Don't:

- Hard-code selectors in test files
- Use arbitrary `waitForTimeout()` (use `waitForLoadState()` instead)
- Test implementation details
- Write tests that depend on each other
- Commit `.auth/user.json` to git

## 🔧 Configuration

Test configuration is in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'chromium', dependencies: ['setup'] },
    { name: 'firefox', dependencies: ['setup'] },
    { name: 'webkit', dependencies: ['setup'] },
  ],
});
```

## 🚦 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run tests
        run: pnpm test:e2e
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Authentication Guide](https://playwright.dev/docs/auth)
- [Debugging Tests](https://playwright.dev/docs/debug)

## 🆘 Troubleshooting

### Tests Fail with "Target Closed" Error

**Solution**: Increase timeout or check for navigation issues:
```typescript
test.setTimeout(60000); // 60 seconds
```

### Authentication Setup Fails

**Solution**: Check test credentials in `.env.test` and verify login page selectors.

### Calendar Not Loading

**Solution**: Increase wait time for React Query:
```typescript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
```

### Selectors Not Found

**Solution**: Use Playwright Codegen to generate correct selectors:
```bash
pnpm playwright:codegen
```

## 📞 Support

For questions or issues with e2e tests:
1. Check the [Playwright docs](https://playwright.dev/)
2. Review existing test examples in `e2e/calendar/`
3. Use `pnpm test:e2e:debug` to debug failing tests
4. Check test reports with `pnpm exec playwright show-report`
