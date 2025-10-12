import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnnouncementEntity } from '../db/entities'
import {
  createAnnouncement,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getPublishedAnnouncements,
  getAnnouncementsByStatus,
  expireAnnouncements,
} from './announcements'
import { createMockAnnouncement } from '../tests/factories'

// Mock ElectroDB entity
vi.mock('../db/entities', () => ({
  AnnouncementEntity: {
    create: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    query: {
      byStatus: vi.fn(),
    },
  },
}))

describe('Announcements Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createAnnouncement', () => {
    it('should create a new announcement', async () => {
      const mockAnnouncement = createMockAnnouncement()
      const announcementData = {
        title: mockAnnouncement.title,
        content: mockAnnouncement.content,
        priority: mockAnnouncement.priority,
        status: mockAnnouncement.status,
        category: mockAnnouncement.category,
        created_by: mockAnnouncement.created_by,
      }

      const mockCreate = vi.fn().mockResolvedValue({ data: mockAnnouncement })
      vi.mocked(AnnouncementEntity.create).mockReturnValue({ go: mockCreate } as any)

      const result = await createAnnouncement(announcementData)

      expect(AnnouncementEntity.create).toHaveBeenCalledWith(announcementData)
      expect(mockCreate).toHaveBeenCalled()
      expect(result).toEqual(mockAnnouncement)
    })
  })

  describe('getAnnouncement', () => {
    it('should get an announcement by ID', async () => {
      const mockAnnouncement = createMockAnnouncement()
      const mockGet = vi.fn().mockResolvedValue({ data: mockAnnouncement })

      vi.mocked(AnnouncementEntity.get).mockReturnValue({ go: mockGet } as any)

      const result = await getAnnouncement('test-announcement-id')

      expect(AnnouncementEntity.get).toHaveBeenCalledWith({ id: 'test-announcement-id' })
      expect(mockGet).toHaveBeenCalled()
      expect(result).toEqual(mockAnnouncement)
    })

    it('should return null if announcement not found', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: null })

      vi.mocked(AnnouncementEntity.get).mockReturnValue({ go: mockGet } as any)

      const result = await getAnnouncement('nonexistent-id')

      expect(result).toBeNull()
    })
  })

  describe('updateAnnouncement', () => {
    it('should update an announcement without priority/status changes', async () => {
      const mockAnnouncement = createMockAnnouncement({
        title: 'Updated Announcement',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: mockAnnouncement })
      const mockSet = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(AnnouncementEntity.patch).mockReturnValue({ set: mockSet } as any)

      const updates = { title: 'Updated Announcement' }
      const result = await updateAnnouncement('test-announcement-id', updates)

      expect(AnnouncementEntity.patch).toHaveBeenCalledWith({ id: 'test-announcement-id' })
      expect(mockSet).toHaveBeenCalledWith(updates)
      expect(mockGo).toHaveBeenCalledWith({ response: 'all_new' })
      expect(result).toEqual(mockAnnouncement)
    })

    it('should update an announcement with priority changes', async () => {
      const existingAnnouncement = createMockAnnouncement({
        priority: 'medium',
        created_at: '2025-01-01T00:00:00Z',
      })

      const updatedAnnouncement = createMockAnnouncement({
        priority: 'high',
      })

      // Mock getAnnouncement
      const mockGet = vi.fn().mockResolvedValue({ data: existingAnnouncement })
      vi.mocked(AnnouncementEntity.get).mockReturnValue({ go: mockGet } as any)

      // Mock patch
      const mockGo = vi.fn().mockResolvedValue({ data: updatedAnnouncement })
      const mockComposite = vi.fn().mockReturnValue({ go: mockGo })
      const mockSet = vi.fn().mockReturnValue({ composite: mockComposite })

      vi.mocked(AnnouncementEntity.patch).mockReturnValue({ set: mockSet } as any)

      const result = await updateAnnouncement('test-announcement-id', { priority: 'high' })

      expect(mockComposite).toHaveBeenCalledWith({ created_at: existingAnnouncement.created_at })
      expect(result).toEqual(updatedAnnouncement)
    })

    it('should return null if announcement not found when updating priority', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: null })
      vi.mocked(AnnouncementEntity.get).mockReturnValue({ go: mockGet } as any)

      const result = await updateAnnouncement('nonexistent-id', { priority: 'high' })

      expect(result).toBeNull()
    })
  })

  describe('deleteAnnouncement', () => {
    it('should delete an announcement', async () => {
      const mockDelete = vi.fn().mockResolvedValue({})

      vi.mocked(AnnouncementEntity.delete).mockReturnValue({ go: mockDelete } as any)

      await deleteAnnouncement('test-announcement-id')

      expect(AnnouncementEntity.delete).toHaveBeenCalledWith({ id: 'test-announcement-id' })
      expect(mockDelete).toHaveBeenCalled()
    })
  })

  describe('getPublishedAnnouncements', () => {
    it('should get published announcements sorted by priority and date', async () => {
      const highPriorityAnnouncement = createMockAnnouncement({
        id: 'announcement-1',
        priority: 'high',
        status: 'published',
        created_at: '2025-01-15T00:00:00Z',
      })

      const mediumPriorityAnnouncement = createMockAnnouncement({
        id: 'announcement-2',
        priority: 'medium',
        status: 'published',
        created_at: '2025-01-16T00:00:00Z',
      })

      const lowPriorityAnnouncement = createMockAnnouncement({
        id: 'announcement-3',
        priority: 'low',
        status: 'published',
        created_at: '2025-01-17T00:00:00Z',
      })

      const mockGo = vi.fn().mockResolvedValue({
        data: [mediumPriorityAnnouncement, lowPriorityAnnouncement, highPriorityAnnouncement],
      })

      vi.mocked(AnnouncementEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getPublishedAnnouncements()

      expect(AnnouncementEntity.query.byStatus).toHaveBeenCalledWith({ status: 'published' })
      expect(mockGo).toHaveBeenCalled()

      // Should be sorted by priority (high, medium, low)
      expect(result[0].priority).toBe('high')
      expect(result[1].priority).toBe('medium')
      expect(result[2].priority).toBe('low')
    })

    it('should filter out expired announcements', async () => {
      const activeAnnouncement = createMockAnnouncement({
        id: 'announcement-1',
        status: 'published',
        expires_at: '2099-12-31T23:59:59Z', // Future date
      })

      const expiredAnnouncement = createMockAnnouncement({
        id: 'announcement-2',
        status: 'published',
        expires_at: '2020-01-01T00:00:00Z', // Past date
      })

      const mockGo = vi.fn().mockResolvedValue({
        data: [activeAnnouncement, expiredAnnouncement],
      })

      vi.mocked(AnnouncementEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getPublishedAnnouncements()

      // Should only include active announcement
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('announcement-1')
    })

    it('should sort by date when priorities are equal', async () => {
      const olderAnnouncement = createMockAnnouncement({
        id: 'announcement-1',
        priority: 'high',
        created_at: '2025-01-15T00:00:00Z',
      })

      const newerAnnouncement = createMockAnnouncement({
        id: 'announcement-2',
        priority: 'high',
        created_at: '2025-01-16T00:00:00Z',
      })

      const mockGo = vi.fn().mockResolvedValue({
        data: [olderAnnouncement, newerAnnouncement],
      })

      vi.mocked(AnnouncementEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getPublishedAnnouncements()

      // Should be sorted by date (newest first when priorities equal)
      expect(result[0].id).toBe('announcement-2')
      expect(result[1].id).toBe('announcement-1')
    })
  })

  describe('getAnnouncementsByStatus', () => {
    it('should get announcements by status', async () => {
      const draftAnnouncement = createMockAnnouncement({
        id: 'draft-announcement',
        status: 'draft',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [draftAnnouncement] })

      vi.mocked(AnnouncementEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getAnnouncementsByStatus('draft')

      expect(AnnouncementEntity.query.byStatus).toHaveBeenCalledWith({ status: 'draft' })
      expect(result).toEqual([draftAnnouncement])
    })

    it('should sort results by priority and date', async () => {
      const highPriorityAnnouncement = createMockAnnouncement({
        id: 'announcement-1',
        priority: 'high',
        created_at: '2025-01-15T00:00:00Z',
      })

      const mediumPriorityAnnouncement = createMockAnnouncement({
        id: 'announcement-2',
        priority: 'medium',
        created_at: '2025-01-16T00:00:00Z',
      })

      const mockGo = vi.fn().mockResolvedValue({
        data: [mediumPriorityAnnouncement, highPriorityAnnouncement],
      })

      vi.mocked(AnnouncementEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const result = await getAnnouncementsByStatus('published')

      // Should be sorted by priority
      expect(result[0].priority).toBe('high')
      expect(result[1].priority).toBe('medium')
    })
  })

  describe('expireAnnouncements', () => {
    it('should expire announcements that have passed their expiry date', async () => {
      const expiredAnnouncement1 = createMockAnnouncement({
        id: 'expired-1',
        status: 'published',
        expires_at: '2020-01-01T00:00:00Z', // Past date
      })

      const expiredAnnouncement2 = createMockAnnouncement({
        id: 'expired-2',
        status: 'published',
        expires_at: '2020-01-02T00:00:00Z', // Past date
      })

      const activeAnnouncement = createMockAnnouncement({
        id: 'active-1',
        status: 'published',
        expires_at: '2099-12-31T23:59:59Z', // Future date
      })

      // Mock getAnnouncementsByStatus
      const mockGo = vi.fn().mockResolvedValue({
        data: [expiredAnnouncement1, expiredAnnouncement2, activeAnnouncement],
      })

      vi.mocked(AnnouncementEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      // Mock updateAnnouncement via the patch method
      const mockGet = vi.fn()
        .mockResolvedValueOnce({ data: expiredAnnouncement1 })
        .mockResolvedValueOnce({ data: expiredAnnouncement2 })

      vi.mocked(AnnouncementEntity.get).mockReturnValue({ go: mockGet } as any)

      const mockUpdateGo = vi.fn().mockResolvedValue({ data: {} })
      const mockComposite = vi.fn().mockReturnValue({ go: mockUpdateGo })
      const mockSet = vi.fn().mockReturnValue({ composite: mockComposite })

      vi.mocked(AnnouncementEntity.patch).mockReturnValue({ set: mockSet } as any)

      const expiredCount = await expireAnnouncements()

      expect(expiredCount).toBe(2)
      expect(AnnouncementEntity.patch).toHaveBeenCalledTimes(2)
    })

    it('should return 0 if no announcements to expire', async () => {
      const activeAnnouncement = createMockAnnouncement({
        id: 'active-1',
        status: 'published',
        expires_at: '2099-12-31T23:59:59Z', // Future date
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [activeAnnouncement] })

      vi.mocked(AnnouncementEntity.query.byStatus).mockReturnValue({ go: mockGo } as any)

      const expiredCount = await expireAnnouncements()

      expect(expiredCount).toBe(0)
      expect(AnnouncementEntity.patch).not.toHaveBeenCalled()
    })
  })
})
