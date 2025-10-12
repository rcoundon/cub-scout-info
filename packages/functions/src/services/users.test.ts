import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserEntity } from '../db/entities'
import {
  createUser,
  getUser,
  getUserByEmail,
  getAllUsers,
  updateUser,
  deleteUser,
  updateLastLogin,
  updateUserRole,
} from './users'
import { createMockUser } from '../tests/factories'

// Mock ElectroDB entity
vi.mock('../db/entities', () => ({
  UserEntity: {
    create: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    query: {
      byEmail: vi.fn(),
    },
    scan: {
      go: vi.fn(),
    },
  },
}))

describe('Users Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUser', () => {
    it('should create a new user with provided ID', async () => {
      const mockUser = createMockUser({
        id: 'cognito-user-123',
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User',
        role: 'editor',
      })

      const mockCreate = vi.fn().mockResolvedValue({ data: mockUser })
      vi.mocked(UserEntity.create).mockReturnValue({ go: mockCreate } as any)

      const userData = {
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User',
        role: 'editor' as const,
      }

      const result = await createUser('cognito-user-123', userData)

      expect(UserEntity.create).toHaveBeenCalledWith({
        id: 'cognito-user-123',
        ...userData,
      })

      expect(mockCreate).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should create an admin user', async () => {
      const mockAdmin = createMockUser({
        id: 'cognito-admin-123',
        email: 'admin@example.com',
        role: 'admin',
      })

      const mockCreate = vi.fn().mockResolvedValue({ data: mockAdmin })
      vi.mocked(UserEntity.create).mockReturnValue({ go: mockCreate } as any)

      const userData = {
        email: 'admin@example.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin' as const,
      }

      const result = await createUser('cognito-admin-123', userData)

      expect(result.role).toBe('admin')
    })
  })

  describe('getUser', () => {
    it('should get a user by ID', async () => {
      const mockUser = createMockUser()
      const mockGet = vi.fn().mockResolvedValue({ data: mockUser })

      vi.mocked(UserEntity.get).mockReturnValue({ go: mockGet } as any)

      const result = await getUser('test-user-id')

      expect(UserEntity.get).toHaveBeenCalledWith({ id: 'test-user-id' })
      expect(mockGet).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should return null if user not found', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: null })

      vi.mocked(UserEntity.get).mockReturnValue({ go: mockGet } as any)

      const result = await getUser('nonexistent-id')

      expect(result).toBeNull()
    })
  })

  describe('getUserByEmail', () => {
    it('should get a user by email', async () => {
      const mockUser = createMockUser({
        email: 'test@example.com',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [mockUser] })

      vi.mocked(UserEntity.query.byEmail).mockReturnValue({ go: mockGo } as any)

      const result = await getUserByEmail('test@example.com')

      expect(UserEntity.query.byEmail).toHaveBeenCalledWith({ email: 'test@example.com' })
      expect(mockGo).toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should normalize email to lowercase', async () => {
      const mockUser = createMockUser({
        email: 'test@example.com',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: [mockUser] })

      vi.mocked(UserEntity.query.byEmail).mockReturnValue({ go: mockGo } as any)

      await getUserByEmail('TEST@EXAMPLE.COM')

      expect(UserEntity.query.byEmail).toHaveBeenCalledWith({ email: 'test@example.com' })
    })

    it('should return null if user not found', async () => {
      const mockGo = vi.fn().mockResolvedValue({ data: [] })

      vi.mocked(UserEntity.query.byEmail).mockReturnValue({ go: mockGo } as any)

      const result = await getUserByEmail('nonexistent@example.com')

      expect(result).toBeNull()
    })
  })

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      const user1 = createMockUser({ id: 'user-1', email: 'user1@example.com' })
      const user2 = createMockUser({ id: 'user-2', email: 'user2@example.com' })
      const user3 = createMockUser({ id: 'user-3', email: 'user3@example.com' })

      vi.mocked(UserEntity.scan.go).mockResolvedValue({ data: [user1, user2, user3] } as any)

      const result = await getAllUsers()

      expect(UserEntity.scan.go).toHaveBeenCalled()
      expect(result).toEqual([user1, user2, user3])
      expect(result).toHaveLength(3)
    })

    it('should return empty array if no users', async () => {
      vi.mocked(UserEntity.scan.go).mockResolvedValue({ data: [] } as any)

      const result = await getAllUsers()

      expect(result).toEqual([])
    })
  })

  describe('updateUser', () => {
    it('should update user properties', async () => {
      const mockUser = createMockUser({
        first_name: 'Updated',
        last_name: 'Name',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: mockUser })
      const mockSet = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(UserEntity.patch).mockReturnValue({ set: mockSet } as any)

      const updates = {
        first_name: 'Updated',
        last_name: 'Name',
      }

      const result = await updateUser('test-user-id', updates)

      expect(UserEntity.patch).toHaveBeenCalledWith({ id: 'test-user-id' })
      expect(mockSet).toHaveBeenCalledWith(updates)
      expect(mockGo).toHaveBeenCalledWith({ response: 'all_new' })
      expect(result).toEqual(mockUser)
    })

    it('should update user role', async () => {
      const mockUser = createMockUser({
        role: 'admin',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: mockUser })
      const mockSet = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(UserEntity.patch).mockReturnValue({ set: mockSet } as any)

      const result = await updateUser('test-user-id', { role: 'admin' })

      expect(mockSet).toHaveBeenCalledWith({ role: 'admin' })
      expect(result?.role).toBe('admin')
    })

    it('should return null if user not found', async () => {
      const mockGo = vi.fn().mockResolvedValue({ data: null })
      const mockSet = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(UserEntity.patch).mockReturnValue({ set: mockSet } as any)

      const result = await updateUser('nonexistent-id', { first_name: 'Updated' })

      expect(result).toBeNull()
    })
  })

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const mockDelete = vi.fn().mockResolvedValue({})

      vi.mocked(UserEntity.delete).mockReturnValue({ go: mockDelete } as any)

      await deleteUser('test-user-id')

      expect(UserEntity.delete).toHaveBeenCalledWith({ id: 'test-user-id' })
      expect(mockDelete).toHaveBeenCalled()
    })
  })

  describe('updateLastLogin', () => {
    it('should update the last login timestamp', async () => {
      const mockUser = createMockUser({
        last_login: '2025-01-15T10:00:00Z',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: mockUser })
      const mockSet = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(UserEntity.patch).mockReturnValue({ set: mockSet } as any)

      await updateLastLogin('test-user-id')

      expect(UserEntity.patch).toHaveBeenCalledWith({ id: 'test-user-id' })
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          last_login: expect.any(String),
        })
      )
    })

    it('should use current timestamp', async () => {
      const beforeTime = new Date().toISOString()

      const mockGo = vi.fn().mockResolvedValue({ data: {} })
      const mockSet = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(UserEntity.patch).mockReturnValue({ set: mockSet } as any)

      await updateLastLogin('test-user-id')

      const afterTime = new Date().toISOString()

      const callArgs = mockSet.mock.calls[0][0]
      const lastLogin = callArgs.last_login

      expect(lastLogin).toBeDefined()
      expect(lastLogin >= beforeTime).toBe(true)
      expect(lastLogin <= afterTime).toBe(true)
    })
  })

  describe('updateUserRole', () => {
    it('should update user role to admin', async () => {
      const mockUser = createMockUser({
        role: 'admin',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: mockUser })
      const mockSet = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(UserEntity.patch).mockReturnValue({ set: mockSet } as any)

      const result = await updateUserRole('test-user-id', 'admin')

      expect(mockSet).toHaveBeenCalledWith({ role: 'admin' })
      expect(result?.role).toBe('admin')
    })

    it('should update user role to editor', async () => {
      const mockUser = createMockUser({
        role: 'editor',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: mockUser })
      const mockSet = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(UserEntity.patch).mockReturnValue({ set: mockSet } as any)

      const result = await updateUserRole('test-user-id', 'editor')

      expect(result?.role).toBe('editor')
    })

    it('should update user role to viewer', async () => {
      const mockUser = createMockUser({
        role: 'viewer',
      })

      const mockGo = vi.fn().mockResolvedValue({ data: mockUser })
      const mockSet = vi.fn().mockReturnValue({ go: mockGo })

      vi.mocked(UserEntity.patch).mockReturnValue({ set: mockSet } as any)

      const result = await updateUserRole('test-user-id', 'viewer')

      expect(result?.role).toBe('viewer')
    })
  })
})
