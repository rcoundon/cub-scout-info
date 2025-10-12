import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEntity } from '../db/entities'
import {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  getPublishedEvents,
  getPublicEvents,
  getPublishedEventsExpanded,
  getEventsByStatusRaw,
  getEventsByStatus,
  getEventsByType,
  duplicateEvent,
} from './events'
import { createMockEvent } from '../tests/factories'

// Mock ElectroDB entity
vi.mock('../db/entities', () => ({
  EventEntity: {
    create: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    query: {
      byStatus: vi.fn(),
      byType: vi.fn(),
    },
  },
}))

describe('Events Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createEvent', () => {
    it('should create a new event', async () => {
      const mockEvent = createMockEvent()
      const eventData = {
        title: mockEvent.title,
        description: mockEvent.description,
        start_date: mockEvent.start_date,
        end_date: mockEvent.end_date,
        location: mockEvent.location,
        age_group: mockEvent.age_group,
        event_type: mockEvent.event_type,
        status: mockEvent.status,
        is_recurring: mockEvent.is_recurring,
        created_by: mockEvent.created_by,
      }

      const mockCreate = vi.fn().mockResolvedValue({ data: mockEvent })
      vi.mocked(EventEntity.create).mockReturnValue({
        go: mockCreate,
      } as any)

      const result = await createEvent(eventData)

      expect(EventEntity.create).toHaveBeenCalledWith(eventData)
      expect(mockCreate).toHaveBeenCalled()
      expect(result).toEqual(mockEvent)
    })
  })

  describe('getEvent', () => {
    it('should get an event by ID', async () => {
      const mockEvent = createMockEvent()
      const mockGet = vi.fn().mockResolvedValue({ data: mockEvent })

      vi.mocked(EventEntity.get).mockReturnValue({
        go: mockGet,
      } as any)

      const result = await getEvent('test-event-id')

      expect(EventEntity.get).toHaveBeenCalledWith({ id: 'test-event-id' })
      expect(mockGet).toHaveBeenCalled()
      expect(result).toEqual(mockEvent)
    })

    it('should return null if event not found', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: null })

      vi.mocked(EventEntity.get).mockReturnValue({
        go: mockGet,
      } as any)

      const result = await getEvent('nonexistent-id')

      expect(result).toBeNull()
    })
  })

  describe('updateEvent', () => {
    it('should update an event', async () => {
      const mockEvent = createMockEvent({
        title: 'Updated Event',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: mockEvent })
      const mockSet = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(EventEntity.patch).mockReturnValue({ set: mockSet } as any)

      const updates = { title: 'Updated Event' }
      const result = await updateEvent('test-event-id', updates)

      expect(EventEntity.patch).toHaveBeenCalledWith({ id: 'test-event-id' })
      expect(mockSet).toHaveBeenCalledWith(updates)
      expect(mockGo).toHaveBeenCalledWith({ response: 'all_new' })
      expect(result).toEqual(mockEvent)
    })

    it('should return null if event not found', async () => {
      const mockGo = vi.fn().mockResolvedValue({ data: null })
      const mockSet = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(EventEntity.patch).mockReturnValue({ set: mockSet } as any)

      const result = await updateEvent('nonexistent-id', { title: 'Updated' })

      expect(result).toBeNull()
    })
  })

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const mockDelete = vi.fn().mockResolvedValue({})

      vi.mocked(EventEntity.delete).mockReturnValue({
        go: mockDelete,
      } as any)

      await deleteEvent('test-event-id')

      expect(EventEntity.delete).toHaveBeenCalledWith({ id: 'test-event-id' })
      expect(mockDelete).toHaveBeenCalled()
    })
  })

  describe('getPublishedEvents', () => {
    it('should get all published events sorted by date', async () => {
      const event1 = createMockEvent({
        id: 'event-1',
        start_date: '2025-01-20T10:00:00Z',
        status: 'published',
      })
      const event2 = createMockEvent({
        id: 'event-2',
        start_date: '2025-01-15T10:00:00Z',
        status: 'published',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [event1, event2] })

      vi.mocked(EventEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getPublishedEvents()

      expect(EventEntity.query.byStatus).toHaveBeenCalledWith({ status: 'published' })
      expect(mockGo).toHaveBeenCalled()
      // Should be sorted by date (event2 before event1)
      expect(result[0].id).toBe('event-2')
      expect(result[1].id).toBe('event-1')
    })
  })

  describe('getPublicEvents', () => {
    it('should get all published and cancelled events', async () => {
      const publishedEvent = createMockEvent({
        id: 'event-1',
        status: 'published',
        start_date: '2025-01-15T10:00:00Z',
      })
      const cancelledEvent = createMockEvent({
        id: 'event-2',
        status: 'cancelled',
        start_date: '2025-01-20T10:00:00Z',
      })

      const mockPublishedGo = vi.fn().mockResolvedValue({ data: [publishedEvent] })
      const mockCancelledGo = vi.fn().mockResolvedValue({ data: [cancelledEvent] })

      vi.mocked(EventEntity.query.byStatus)
        .mockReturnValueOnce({ go: mockPublishedGo } as any)
        .mockReturnValueOnce({ go: mockCancelledGo } as any)

      const result = await getPublicEvents()

      expect(EventEntity.query.byStatus).toHaveBeenCalledWith({ status: 'published' })
      expect(EventEntity.query.byStatus).toHaveBeenCalledWith({ status: 'cancelled' })
      expect(result).toHaveLength(2)
      // Should be sorted by date
      expect(result[0].id).toBe('event-1')
      expect(result[1].id).toBe('event-2')
    })
  })

  describe('getPublishedEventsExpanded', () => {
    it('should expand recurring events', async () => {
      const recurringEvent = createMockEvent({
        id: 'recurring-event',
        start_date: '2025-01-15T10:00:00Z',
        end_date: '2025-01-15T12:00:00Z',
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;UNTIL=20250129',
        status: 'published',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [recurringEvent] })

      vi.mocked(EventEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getPublishedEventsExpanded()

      expect(result.length).toBeGreaterThan(1) // Should have multiple occurrences
      expect(result[0].id).toContain('recurring-event') // Each occurrence has modified ID
    })

    it('should not expand non-recurring events', async () => {
      const singleEvent = createMockEvent({
        id: 'single-event',
        is_recurring: false,
        status: 'published',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [singleEvent] })

      vi.mocked(EventEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getPublishedEventsExpanded()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('single-event')
    })
  })

  describe('getEventsByStatusRaw', () => {
    it('should get events by status without expanding', async () => {
      const draftEvent = createMockEvent({
        id: 'draft-event',
        status: 'draft',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [draftEvent] })

      vi.mocked(EventEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getEventsByStatusRaw('draft')

      expect(EventEntity.query.byStatus).toHaveBeenCalledWith({ status: 'draft' })
      expect(result).toEqual([draftEvent])
    })
  })

  describe('getEventsByStatus', () => {
    it('should get events by status with expansion', async () => {
      const recurringEvent = createMockEvent({
        id: 'recurring-draft',
        status: 'draft',
        is_recurring: true,
        recurrence_rule: 'FREQ=DAILY;UNTIL=20250117',
        start_date: '2025-01-15T10:00:00Z',
        end_date: '2025-01-15T12:00:00Z',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [recurringEvent] })

      vi.mocked(EventEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getEventsByStatus('draft')

      expect(result.length).toBeGreaterThan(1) // Should expand daily occurrences
    })
  })

  describe('getEventsByType', () => {
    it('should get events by type in date range', async () => {
      const campEvent = createMockEvent({
        id: 'camp-event',
        event_type: 'camp',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [campEvent] })
      const mockBetween = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(EventEntity.query.byType).mockReturnValue({ between: mockBetween } as any)

      const result = await getEventsByType('camp', '2025-01-01', '2025-12-31')

      expect(EventEntity.query.byType).toHaveBeenCalledWith({ event_type: 'camp' })
      expect(mockBetween).toHaveBeenCalledWith(
        { start_date: '2025-01-01' },
        { start_date: '2025-12-31' }
      )
      expect(result).toEqual([campEvent])
    })
  })

  describe('duplicateEvent', () => {
    it('should duplicate an event with new ID and draft status', async () => {
      const originalEvent = createMockEvent({
        id: 'original-event',
        title: 'Original Event',
        status: 'published',
      })

      const duplicatedEvent = createMockEvent({
        id: 'new-event-id',
        title: 'Copy of Original Event',
        status: 'draft',
      })

      // Mock getEvent
      const mockGet = vi.fn().mockResolvedValue({ data: originalEvent })
      vi.mocked(EventEntity.get).mockReturnValue({
        go: mockGet,
      } as any)

      // Mock create
      const mockCreate = vi.fn().mockResolvedValue({ data: duplicatedEvent })
      vi.mocked(EventEntity.create).mockReturnValue({
        go: mockCreate,
      } as any)

      const result = await duplicateEvent('original-event')

      expect(result).toBeDefined()
      expect(result?.title).toBe('Copy of Original Event')
      expect(result?.status).toBe('draft')
      expect(EventEntity.create).toHaveBeenCalled()
    })

    it('should return null if original event not found', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: null })
      vi.mocked(EventEntity.get).mockReturnValue({
        go: mockGet,
      } as any)

      const result = await duplicateEvent('nonexistent-id')

      expect(result).toBeNull()
      expect(EventEntity.create).not.toHaveBeenCalled()
    })
  })

  describe('expandRecurringEvent', () => {
    it('should handle WEEKLY recurrence', async () => {
      const recurringEvent = createMockEvent({
        id: 'weekly-event',
        start_date: '2025-01-15T10:00:00Z',
        end_date: '2025-01-15T12:00:00Z',
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;UNTIL=20250205', // 3 weeks
        status: 'published',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [recurringEvent] })

      vi.mocked(EventEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getPublishedEventsExpanded()

      // Should have 3-4 occurrences (Jan 15, 22, 29, possibly Feb 5)
      expect(result.length).toBeGreaterThanOrEqual(3)
      expect(result.length).toBeLessThanOrEqual(4)
    })

    it('should handle MONTHLY recurrence', async () => {
      const recurringEvent = createMockEvent({
        id: 'monthly-event',
        start_date: '2025-01-15T10:00:00Z',
        end_date: '2025-01-15T12:00:00Z',
        is_recurring: true,
        recurrence_rule: 'FREQ=MONTHLY;UNTIL=20250320', // 3 months (extra days to ensure March is included)
        status: 'published',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [recurringEvent] })

      vi.mocked(EventEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getPublishedEventsExpanded()

      // Should have 3 occurrences (Jan 15, Feb 15, Mar 15)
      expect(result.length).toBe(3)
    })

    it('should respect the 1000 occurrence safety limit', async () => {
      const recurringEvent = createMockEvent({
        id: 'infinite-event',
        start_date: '2025-01-01T10:00:00Z',
        end_date: '2025-01-01T12:00:00Z',
        is_recurring: true,
        recurrence_rule: 'FREQ=DAILY;UNTIL=20990101', // Way in the future
        status: 'published',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [recurringEvent] })

      vi.mocked(EventEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getPublishedEventsExpanded()

      // Should not exceed 1000 occurrences
      expect(result.length).toBeLessThanOrEqual(1000)
    })
  })
})
