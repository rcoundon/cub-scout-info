import { test as base } from '@playwright/test'
import { login, logout, TEST_USERS, type TestUser } from './auth'

type TestFixtures = {
  authenticatedPage: {
    page: any
    user: TestUser
  }
  adminPage: any
  editorPage: any
}

export const test = base.extend<TestFixtures>({
  // Authenticated page fixture - logs in with a specified user
  authenticatedPage: async ({ page }, use, testInfo) => {
    // Default to editor role for authenticated tests
    const user = TEST_USERS.editor
    await login(page, user)
    await use({ page, user })
    // Cleanup: logout after test
    await logout(page)
  },

  // Admin page fixture - logs in as admin
  adminPage: async ({ page }, use) => {
    await login(page, TEST_USERS.admin)
    await use(page)
    await logout(page)
  },

  // Editor page fixture - logs in as editor
  editorPage: async ({ page }, use) => {
    await login(page, TEST_USERS.editor)
    await use(page)
    await logout(page)
  },
})

export { expect } from '@playwright/test'
export { TEST_USERS, login, logout, isLoggedIn } from './auth'
