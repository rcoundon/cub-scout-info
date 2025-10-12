import type { Page } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
  role: 'admin' | 'editor' | 'viewer'
}

export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    role: 'admin' as const,
  },
  editor: {
    email: 'editor@test.com',
    password: 'Editor123!',
    role: 'editor' as const,
  },
  viewer: {
    email: 'viewer@test.com',
    password: 'Viewer123!',
    role: 'viewer' as const,
  },
}

export async function login(page: Page, user: TestUser) {
  await page.goto('/login', { waitUntil: 'networkidle' })

  // Wait for login form to be visible
  await page.waitForSelector('form', { timeout: 10000 })

  // Fill in login credentials
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)

  // Submit the form and wait for navigation
  await Promise.all([
    page.waitForURL((url) => url.pathname !== '/login', { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ])

  // Wait for page to stabilize after login
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    // If networkidle times out, continue anyway
    console.log('Network idle timeout - continuing')
  })
}

export async function logout(page: Page) {
  // Try multiple logout selectors in case implementation varies
  const logoutSelectors = [
    '[data-testid="logout-button"]',
    'button:has-text("Logout")',
    'button:has-text("Log out")',
    'a:has-text("Logout")',
    'a:has-text("Log out")',
  ]

  let loggedOut = false
  for (const selector of logoutSelectors) {
    const element = page.locator(selector)
    const count = await element.count()
    if (count > 0) {
      await element.first().click()
      loggedOut = true
      break
    }
  }

  if (loggedOut) {
    // Wait for redirect to login page
    await page.waitForURL('/login', { timeout: 10000 }).catch(() => {
      console.log('Logout redirect timeout - may already be logged out')
    })
  }
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check if user menu or profile element is visible
  const userMenu = page.locator('[data-testid="user-menu"]')
  return await userMenu.isVisible()
}
