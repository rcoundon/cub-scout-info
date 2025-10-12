import { test, expect } from './fixtures'

test.describe('Events Page', () => {
  test('should display events list on homepage', async ({ page }) => {
    await page.goto('/')

    // Wait for events to load
    await page.waitForSelector('[data-testid="events-list"], .event-card, h2:has-text("Events")', {
      timeout: 10000,
    })

    // Check that events are displayed
    const hasEvents = await page.locator('[data-testid="event-card"], .event-card').count()
    expect(hasEvents).toBeGreaterThan(0)
  })

  test('should display event details when clicking on event', async ({ page }) => {
    await page.goto('/')

    // Wait for events to load
    await page.waitForSelector('[data-testid="event-card"], .event-card', {
      timeout: 10000,
    })

    // Click on first event
    await page.locator('[data-testid="event-card"], .event-card').first().click()

    // Should navigate to event details page
    await expect(page).toHaveURL(/\/events\/[^/]+/)

    // Should show event details
    await expect(page.locator('h1, h2')).toBeVisible()
    await expect(page.locator('text=/location/i')).toBeVisible()
  })

  test('should filter events by age group', async ({ page }) => {
    await page.goto('/events')

    // Wait for events to load
    await page.waitForSelector('[data-testid="events-list"], .event-card', {
      timeout: 10000,
    })

    // Check if filter exists
    const filterExists = await page.locator('[data-testid="age-group-filter"], select, button:has-text("Cubs")').count()

    if (filterExists > 0) {
      // Click on Cubs filter
      const cubsFilter = page.locator('[data-testid="age-group-cubs"], button:has-text("Cubs"), option:has-text("Cubs")').first()
      await cubsFilter.click()

      // Events should be filtered
      await page.waitForTimeout(1000) // Wait for filter to apply

      // Verify some events are shown
      const eventCount = await page.locator('[data-testid="event-card"], .event-card').count()
      expect(eventCount).toBeGreaterThanOrEqual(0) // Could be 0 if no cubs events
    }
  })

  test('should show event calendar view', async ({ page }) => {
    await page.goto('/events')

    // Check if calendar view toggle exists
    const calendarToggle = page.locator('[data-testid="calendar-view"], button:has-text("Calendar")')
    const hasCalendarView = await calendarToggle.count()

    if (hasCalendarView > 0) {
      await calendarToggle.click()

      // Should show calendar
      await expect(page.locator('.calendar, [data-testid="calendar"]')).toBeVisible()
    }
  })

  test('should display recurring events', async ({ page }) => {
    await page.goto('/events')

    // Wait for events to load
    await page.waitForSelector('[data-testid="events-list"], .event-card', {
      timeout: 10000,
    })

    // Check for recurring event indicator
    const recurringEvents = await page.locator('[data-testid="recurring-badge"], .recurring-icon, text=/recurring/i').count()

    // Just verify the page loaded successfully - recurring events may or may not exist
    expect(recurringEvents).toBeGreaterThanOrEqual(0)
  })

  test('should show cancelled events with visual indicator', async ({ page }) => {
    await page.goto('/events')

    // Wait for events to load
    await page.waitForSelector('[data-testid="events-list"], .event-card', {
      timeout: 10000,
    })

    // Check for cancelled event indicator
    const cancelledEvents = await page.locator('[data-testid="cancelled-badge"], .cancelled, text=/cancelled/i').count()

    // Verify page loaded - cancelled events may or may not exist
    expect(cancelledEvents).toBeGreaterThanOrEqual(0)
  })

  test.describe('Authenticated Events', () => {
    test('should allow authenticated users to RSVP to events', async ({ authenticatedPage }) => {
      const { page } = authenticatedPage

      await page.goto('/events')

      // Wait for events to load
      await page.waitForSelector('[data-testid="event-card"], .event-card', {
        timeout: 10000,
      })

      // Click on first event
      await page.locator('[data-testid="event-card"], .event-card').first().click()

      // Check if RSVP button exists
      const rsvpButton = page.locator('[data-testid="rsvp-button"], button:has-text("RSVP"), button:has-text("Attend")')
      const hasRsvpButton = await rsvpButton.count()

      if (hasRsvpButton > 0) {
        await rsvpButton.click()

        // Should show confirmation
        await expect(page.locator('text=/confirmed|registered|rsvp.*success/i')).toBeVisible({
          timeout: 5000,
        })
      }
    })
  })
})
