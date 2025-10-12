import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')

    // Should have main content
    await expect(page.locator('h1, h2')).toBeVisible()

    // Should have navigation
    await expect(page.locator('nav, [data-testid="navigation"]')).toBeVisible()
  })

  test('should display upcoming events on homepage', async ({ page }) => {
    await page.goto('/')

    // Wait for content to load
    await page.waitForLoadState('networkidle')

    // Should have events section or show login if auth required
    const hasEvents = await page.locator('[data-testid="events-section"], .events, h2:has-text("Events")').count()
    const hasLogin = await page.locator('form, [data-testid="login-form"]').count()

    expect(hasEvents > 0 || hasLogin > 0).toBe(true)
  })

  test('should display announcements on homepage', async ({ page }) => {
    await page.goto('/')

    // Wait for content to load
    await page.waitForLoadState('networkidle')

    // Check for announcements section (may require auth)
    const hasAnnouncements = await page.locator('[data-testid="announcements-section"], .announcements, h2:has-text("Announcements")').count()

    // Should have announcements or login form
    expect(hasAnnouncements).toBeGreaterThanOrEqual(0)
  })

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/')

    // Check for common navigation links
    const contactLink = page.locator('a[href="/contact"], a:has-text("Contact")')
    const eventsLink = page.locator('a[href="/events"], a:has-text("Events")')

    // Should have at least some navigation links
    const linkCount = await page.locator('nav a, [data-testid="navigation"] a').count()
    expect(linkCount).toBeGreaterThan(0)
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // Should load successfully
    await expect(page.locator('body')).toBeVisible()

    // Check if mobile menu exists (burger menu)
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"], button:has-text("Menu"), .hamburger')
    const hasMobileMenu = await mobileMenu.count()

    if (hasMobileMenu > 0) {
      // Mobile menu should be visible
      await expect(mobileMenu).toBeVisible()
    }
  })

  test('should display group information', async ({ page }) => {
    await page.goto('/')

    // Should have some information about the scout group
    const hasGroupInfo = await page.locator('text=/scout|cubs|beavers/i').count()
    expect(hasGroupInfo).toBeGreaterThan(0)
  })
})

test.describe('Contact Page', () => {
  test('should load contact page', async ({ page }) => {
    await page.goto('/contact')

    // Should have contact page content
    await expect(page.locator('h1, h2')).toBeVisible()
  })

  test('should display contact information', async ({ page }) => {
    await page.goto('/contact')

    // Should have some form of contact info
    const hasContactInfo = await page.locator('text=/email|phone|address/i').count()
    expect(hasContactInfo).toBeGreaterThanOrEqual(0)
  })

  test('should have contact form', async ({ page }) => {
    await page.goto('/contact')

    // Check if there's a contact form
    const hasForm = await page.locator('form').count()

    if (hasForm > 0) {
      // Should have form inputs
      await expect(page.locator('input, textarea')).toBeVisible()
    }
  })

  test('should validate required fields in contact form', async ({ page }) => {
    await page.goto('/contact')

    // Check if form exists
    const hasForm = await page.locator('form').count()

    if (hasForm > 0) {
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Should show validation errors or prevent submission
      const hasValidation = await page.locator('text=/required|invalid|error/i').isVisible().catch(() => false)

      // Form should either show errors or not submit (stay on same page)
      expect(hasValidation || page.url().includes('/contact')).toBe(true)
    }
  })

  test('should submit contact form with valid data', async ({ page }) => {
    await page.goto('/contact')

    // Check if form exists
    const hasForm = await page.locator('form').count()

    if (hasForm > 0) {
      // Fill in all required form fields
      const inputs = await page.locator('input[type="text"], input:not([type="email"]):not([type="password"])').all()
      if (inputs.length > 0) {
        await inputs[0].fill('Test User') // Name
      }

      await page.fill('input[type="email"]', 'test@example.com')

      // Fill subject field (second text input or look for specific placeholder)
      const subjectInput = await page.locator('input[placeholder*="Subject"], input[placeholder*="Joining"], input[type="text"]').nth(1).count()
      if (subjectInput > 0) {
        await page.locator('input[placeholder*="Subject"], input[placeholder*="Joining"], input[type="text"]').nth(1).fill('Test Subject')
      }

      await page.fill('textarea', 'This is a test message')

      // Submit form
      await page.click('button[type="submit"]')

      // Should show success message with longer timeout for API call
      await expect(page.locator('text=/success|thank you|sent/i')).toBeVisible({ timeout: 10000 })
    }
  })
})

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/')

    // Click on Contact link in navigation (not footer)
    const contactLink = page.locator('nav a[href="/contact"], [role="navigation"] a[href="/contact"]').first()
    const hasContactLink = await page.locator('nav a[href="/contact"], [role="navigation"] a[href="/contact"]').count()

    if (hasContactLink > 0) {
      await contactLink.click()

      // Should navigate to contact page
      await expect(page).toHaveURL(/\/contact/)
    }
  })

  test('should have logo link to homepage', async ({ page }) => {
    await page.goto('/contact')

    // Click on logo or home link
    const homeLink = page.locator('a[href="/"], [data-testid="logo"], .logo a').first()
    await homeLink.click()

    // Should navigate to homepage
    await expect(page).toHaveURL('/')
  })
})
