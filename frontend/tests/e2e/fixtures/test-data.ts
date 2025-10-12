export function createTestEvent(overrides?: any) {
  return {
    title: 'Test Event',
    description: 'This is a test event for E2E testing',
    start_date: new Date('2025-12-25T10:00:00Z').toISOString(),
    end_date: new Date('2025-12-25T12:00:00Z').toISOString(),
    location: 'Test Location',
    age_group: 'cubs',
    event_type: 'meeting',
    status: 'published',
    is_recurring: false,
    ...overrides,
  }
}

export function createTestAnnouncement(overrides?: any) {
  return {
    title: 'Test Announcement',
    content: 'This is a test announcement for E2E testing',
    priority: 'medium',
    status: 'published',
    category: 'general',
    ...overrides,
  }
}

export const TEST_FILE_PATHS = {
  pdf: './tests/e2e/fixtures/files/test.pdf',
  image: './tests/e2e/fixtures/files/test.jpg',
  document: './tests/e2e/fixtures/files/test.docx',
}
