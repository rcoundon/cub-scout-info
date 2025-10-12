import { test, expect } from '@playwright/test'
import { login, logout, TEST_USERS, isLoggedIn } from './fixtures'

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login')

    // Should be on login page
    await expect(page).toHaveURL(/\/login/)

    // Should show login form
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    await login(page, TEST_USERS.editor)

    // Should be logged in
    const loggedIn = await isLoggedIn(page)
    expect(loggedIn).toBe(true)

    // Should not be on login page
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Try to login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible()

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should logout successfully', async ({ page }) => {
    await login(page, TEST_USERS.editor)

    // Verify logged in
    const loggedIn = await isLoggedIn(page)
    expect(loggedIn).toBe(true)

    // Logout
    await logout(page)

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/admin/users')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should remember user after page refresh', async ({ page, context }) => {
    await login(page, TEST_USERS.editor)

    // Verify logged in
    const loggedIn = await isLoggedIn(page)
    expect(loggedIn).toBe(true)

    // Refresh the page
    await page.reload()

    // Should still be logged in
    const stillLoggedIn = await isLoggedIn(page)
    expect(stillLoggedIn).toBe(true)
  })

  test('should enforce role-based access', async ({ page }) => {
    // Login as viewer
    await login(page, TEST_USERS.viewer)

    // Try to access admin page
    await page.goto('/admin/users')

    // Should be blocked or redirected (403 or redirect to home)
    const url = page.url()
    const hasAccessDenied = await page.locator('text=/access denied|forbidden|unauthorized/i').isVisible().catch(() => false)

    expect(url.includes('/admin/users') === false || hasAccessDenied).toBe(true)
  })
})
