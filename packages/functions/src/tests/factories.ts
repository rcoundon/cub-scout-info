import type { Event } from '../types/events'
import type { Announcement } from '../types/announcements'

/**
 * Factory functions for creating test data
 */

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'editor' | 'viewer'
  created_at: string
  updated_at?: string
  last_login?: string
}

interface Attachment {
  id: string
  parent_type: 'event' | 'announcement'
  parent_id: string
  file_name: string
  original_name: string
  file_size: number
  content_type: string
  s3_key: string
  uploaded_by: string
  uploaded_at: string
}

export function createMockEvent(overrides?: Partial<Event>): Event {
  return {
    id: 'test-event-id',
    title: 'Test Event',
    description: 'Test event description',
    start_date: '2025-01-15T10:00:00Z',
    end_date: '2025-01-15T12:00:00Z',
    location: 'Test Location',
    age_group: 'cubs',
    event_type: 'meeting',
    status: 'published',
    is_recurring: false,
    recurrence_rule: undefined,
    cost: undefined,
    what_to_bring: undefined,
    rsvp_deadline: undefined,
    organizer_name: undefined,
    organizer_contact: undefined,
    cancellation_reason: undefined,
    created_by: 'test-user-id',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockAnnouncement(overrides?: Partial<Announcement>): Announcement {
  return {
    id: 'test-announcement-id',
    title: 'Test Announcement',
    content: 'Test announcement content',
    category: 'general',
    priority: 'medium',
    status: 'published',
    expires_at: undefined,
    created_by: 'test-user-id',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'editor',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    last_login: undefined,
    ...overrides,
  }
}

export function createMockAttachment(overrides?: Partial<Attachment>): Attachment {
  return {
    id: 'test-attachment-id',
    parent_type: 'event',
    parent_id: 'test-event-id',
    file_name: 'test-file.pdf',
    original_name: 'test-file.pdf',
    file_size: 1024,
    content_type: 'application/pdf',
    s3_key: 'events/test-event-id/attachments/test-attachment-id/test-file.pdf',
    uploaded_by: 'test-user-id',
    uploaded_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}
