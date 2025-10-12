# E2E Tests with Playwright

This directory contains end-to-end tests for the Cubs Site frontend using Playwright.

## Test Structure

```
tests/e2e/
├── fixtures/
│   ├── auth.ts          # Authentication helpers
│   ├── index.ts         # Custom test fixtures
│   └── test-data.ts     # Test data factories
├── auth.spec.ts         # Authentication tests (7 tests)
├── events.spec.ts       # Events page tests (7 tests)
├── admin.spec.ts        # Admin operations tests (15 tests)
├── homepage.spec.ts     # Homepage & contact tests (13 tests)
└── README.md
```

## Test Coverage

### Authentication Tests (`auth.spec.ts`)
- Login page display
- Valid credential login
- Invalid credential handling
- Logout functionality
- Protected route redirection
- Session persistence after refresh
- Role-based access control

### Events Tests (`events.spec.ts`)
- Events list display
- Event detail pages
- Age group filtering
- Calendar view
- Recurring events
- Cancelled events indicators
- RSVP functionality (authenticated)

### Admin Tests (`admin.spec.ts`)
- **Event Management**: Create, edit, delete, publish events
- **Announcement Management**: Create, edit, set priority
- **User Management**: View users, change roles
- **Permissions**: Editor vs Admin access
- **File Attachments**: Upload to events

### Homepage & Contact Tests (`homepage.spec.ts`)
- Homepage loading
- Events and announcements display
- Navigation links
- Mobile responsiveness
- Contact page
- Contact form validation and submission
- Page navigation

## Running Tests

### Run all tests
```bash
pnpm test:e2e
```

### Run tests with UI
```bash
pnpm test:e2e:ui
```

### Run tests in debug mode
```bash
pnpm test:e2e:debug
```

### Run specific test file
```bash
pnpm test:e2e auth.spec.ts
```

### Run tests in specific browser
```bash
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

### View test report
```bash
pnpm test:e2e:report
```

## Test Fixtures

### Authentication Fixtures

The test suite includes custom fixtures for authenticated testing:

```typescript
import { test, expect } from './fixtures'

test('My test', async ({ authenticatedPage }) => {
  const { page, user } = authenticatedPage
  // page is already logged in
})
```

Available fixtures:
- `authenticatedPage` - Generic authenticated user (editor role)
- `adminPage` - Admin user
- `editorPage` - Editor user

### Test Users

Test users are defined in `fixtures/auth.ts`:

```typescript
TEST_USERS.admin   // Admin user
TEST_USERS.editor  // Editor user
TEST_USERS.viewer  // Viewer user
```

**Note**: These test users must exist in your authentication system (Cognito) before running tests.

## Test Data Factories

Use test data factories to create consistent test data:

```typescript
import { createTestEvent, createTestAnnouncement } from './fixtures/test-data'

const event = createTestEvent({
  title: 'Custom Title',
  // ... other overrides
})
```

## Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests/e2e`
- **Browsers**: Chromium, Firefox, WebKit
- **Auto-start server**: Yes (`pnpm dev`)
- **Retries**: 2 in CI, 0 locally
- **Screenshot**: On failure
- **Trace**: On first retry

## CI/CD Integration

Tests are designed to run in CI environments:

- Automatic server startup
- Retry on failure (2 retries in CI)
- HTML report generation
- Screenshot and trace capture on failure

## Writing New Tests

1. Create a new test file in `tests/e2e/`
2. Import test utilities from fixtures:
```typescript
import { test, expect } from './fixtures'
```

3. Use descriptive test names and organize with `describe` blocks:
```typescript
test.describe('Feature Name', () => {
  test('should do something specific', async ({ page }) => {
    // Test implementation
  })
})
```

4. Use data-testid attributes in components for reliable selectors:
```typescript
await page.click('[data-testid="submit-button"]')
```

5. Add fallback selectors for robustness:
```typescript
await page.click('[data-testid="submit-button"], button[type="submit"]')
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Wait for elements**: Use `waitForSelector` or `expect().toBeVisible()`
3. **Use fixtures**: Leverage custom fixtures for common setup
4. **Descriptive names**: Use clear, descriptive test names
5. **Test data**: Use factories for consistent test data
6. **Cleanup**: Fixtures handle cleanup automatically
7. **Selectors**: Prefer data-testid over CSS classes
8. **Assertions**: Use Playwright's built-in assertions

## Debugging

### View trace files
When tests fail, trace files are captured. View them with:
```bash
playwright show-trace trace.zip
```

### Run in headed mode
```bash
pnpm test:e2e --headed
```

### Use debug mode
```bash
pnpm test:e2e:debug
```

This opens Playwright Inspector for step-by-step debugging.

## Test Statistics

- **Total unique tests**: 37
- **Total tests (all browsers)**: 111 (37 × 3 browsers)
- **Test files**: 4
- **Browsers**: 3 (Chromium, Firefox, WebKit)

## Requirements

- Node.js 18+
- pnpm
- Playwright browsers (installed automatically on first run)
- Running backend API
- Test users configured in Cognito

## Setting Up Test Users

Test users can be created automatically using the setup script:

```bash
# From frontend directory - set up users and run tests
pnpm test:e2e:full

# Or just set up users
pnpm test:e2e:setup

# Or manually from packages/functions
cd ../packages/functions
pnpm test:setup-users  # Uses sst shell automatically
```

This will create three test users in Cognito and DynamoDB:
- `admin@test.com` / `Admin123!` (admin role)
- `editor@test.com` / `Editor123!` (editor role)
- `viewer@test.com` / `Viewer123!` (viewer role)

The script is idempotent and safe to run multiple times.

For more details, see `packages/functions/src/scripts/README.md`.
