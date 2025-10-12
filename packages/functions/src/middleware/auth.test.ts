import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import {
  authMiddleware,
  requireRole,
  requireAdmin,
  requireEditor,
  requireAuth,
  getUserContext,
} from './auth'
import * as authUtils from '../utils/auth'
import * as usersService from '../services/users'
import { createMockUser } from '../tests/factories'

// Mock auth utils
vi.mock('../utils/auth', async () => {
  const actual = await vi.importActual('../utils/auth')
  return {
    ...actual,
    extractToken: vi.fn(),
    verifyAccessToken: vi.fn(),
    getUserIdFromToken: vi.fn(),
    hasPermission: vi.fn(),
  }
})

// Mock users service
vi.mock('../services/users', () => ({
  getUser: vi.fn(),
}))

describe('Auth Middleware', () => {
  let app: Hono

  beforeEach(() => {
    vi.clearAllMocks()
    app = new Hono()
  })

  describe('authMiddleware', () => {
    it('should reject requests without Authorization header', async () => {
      vi.mocked(authUtils.extractToken).mockReturnValue(null)

      app.use('*', authMiddleware)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test')

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Missing authentication token' })
    })

    it('should reject requests with invalid token', async () => {
      vi.mocked(authUtils.extractToken).mockReturnValue('invalid-token')
      vi.mocked(authUtils.verifyAccessToken).mockRejectedValue(new Error('Invalid token'))

      app.use('*', authMiddleware)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer invalid-token' },
      })

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.error).toBe('Invalid or expired token')
    })

    it('should reject requests when user not found', async () => {
      vi.mocked(authUtils.extractToken).mockReturnValue('valid-token')
      vi.mocked(authUtils.verifyAccessToken).mockResolvedValue({ sub: 'user-123' })
      vi.mocked(authUtils.getUserIdFromToken).mockReturnValue('user-123')
      vi.mocked(usersService.getUser).mockResolvedValue(null)

      app.use('*', authMiddleware)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(404)
      const body = await res.json()
      expect(body).toEqual({ error: 'User not found' })
    })

    it('should allow requests with valid token and user', async () => {
      const mockUser = createMockUser({
        id: 'user-123',
        email: 'test@example.com',
        role: 'editor',
      })

      vi.mocked(authUtils.extractToken).mockReturnValue('valid-token')
      vi.mocked(authUtils.verifyAccessToken).mockResolvedValue({ sub: 'user-123' })
      vi.mocked(authUtils.getUserIdFromToken).mockReturnValue('user-123')
      vi.mocked(usersService.getUser).mockResolvedValue(mockUser)

      app.use('*', authMiddleware)
      app.get('/test', (c) => {
        const user = c.get('user')
        return c.json({ success: true, user })
      })

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.user.userId).toBe('user-123')
      expect(body.user.email).toBe('test@example.com')
      expect(body.user.role).toBe('editor')
    })

    it('should extract token from Bearer format', async () => {
      const mockUser = createMockUser()

      vi.mocked(authUtils.extractToken).mockReturnValue('token-123')
      vi.mocked(authUtils.verifyAccessToken).mockResolvedValue({ sub: 'user-123' })
      vi.mocked(authUtils.getUserIdFromToken).mockReturnValue('user-123')
      vi.mocked(usersService.getUser).mockResolvedValue(mockUser)

      app.use('*', authMiddleware)
      app.get('/test', (c) => c.json({ success: true }))

      await app.request('/test', {
        headers: { Authorization: 'Bearer token-123' },
      })

      expect(authUtils.extractToken).toHaveBeenCalledWith('Bearer token-123')
    })
  })

  describe('requireRole', () => {
    it('should reject requests without user context', async () => {
      app.use('*', requireRole('editor'))
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test')

      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body).toEqual({ error: 'Unauthorized: User context not found' })
    })

    it('should reject requests with insufficient permissions', async () => {
      const mockUser = createMockUser({ role: 'viewer' })

      vi.mocked(authUtils.extractToken).mockReturnValue('valid-token')
      vi.mocked(authUtils.verifyAccessToken).mockResolvedValue({ sub: 'user-123' })
      vi.mocked(authUtils.getUserIdFromToken).mockReturnValue('user-123')
      vi.mocked(usersService.getUser).mockResolvedValue(mockUser)
      vi.mocked(authUtils.hasPermission).mockReturnValue(false)

      app.use('*', authMiddleware)
      app.use('*', requireRole('admin'))
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toBe('Forbidden: Insufficient permissions')
      expect(body.required).toBe('admin')
      expect(body.current).toBe('viewer')
    })

    it('should allow requests with sufficient permissions', async () => {
      const mockUser = createMockUser({ role: 'admin' })

      vi.mocked(authUtils.extractToken).mockReturnValue('valid-token')
      vi.mocked(authUtils.verifyAccessToken).mockResolvedValue({ sub: 'user-123' })
      vi.mocked(authUtils.getUserIdFromToken).mockReturnValue('user-123')
      vi.mocked(usersService.getUser).mockResolvedValue(mockUser)
      vi.mocked(authUtils.hasPermission).mockReturnValue(true)

      app.use('*', authMiddleware)
      app.use('*', requireRole('editor'))
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
    })
  })

  describe('requireAdmin', () => {
    it('should reject non-admin users', async () => {
      const mockUser = createMockUser({ role: 'editor' })

      vi.mocked(authUtils.extractToken).mockReturnValue('valid-token')
      vi.mocked(authUtils.verifyAccessToken).mockResolvedValue({ sub: 'user-123' })
      vi.mocked(authUtils.getUserIdFromToken).mockReturnValue('user-123')
      vi.mocked(usersService.getUser).mockResolvedValue(mockUser)
      vi.mocked(authUtils.hasPermission).mockReturnValue(false)

      app.use('*', requireAdmin)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toBe('Forbidden: Insufficient permissions')
      expect(body.required).toBe('admin')
    })

    it('should allow admin users', async () => {
      const mockUser = createMockUser({ role: 'admin' })

      vi.mocked(authUtils.extractToken).mockReturnValue('valid-token')
      vi.mocked(authUtils.verifyAccessToken).mockResolvedValue({ sub: 'user-123' })
      vi.mocked(authUtils.getUserIdFromToken).mockReturnValue('user-123')
      vi.mocked(usersService.getUser).mockResolvedValue(mockUser)
      vi.mocked(authUtils.hasPermission).mockReturnValue(true)

      app.use('*', requireAdmin)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(200)
    })
  })

  describe('requireEditor', () => {
    it('should reject viewer users', async () => {
      const mockUser = createMockUser({ role: 'viewer' })

      vi.mocked(authUtils.extractToken).mockReturnValue('valid-token')
      vi.mocked(authUtils.verifyAccessToken).mockResolvedValue({ sub: 'user-123' })
      vi.mocked(authUtils.getUserIdFromToken).mockReturnValue('user-123')
      vi.mocked(usersService.getUser).mockResolvedValue(mockUser)
      vi.mocked(authUtils.hasPermission).mockReturnValue(false)

      app.use('*', requireEditor)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(403)
    })

    it('should allow editor users', async () => {
      const mockUser = createMockUser({ role: 'editor' })

      vi.mocked(authUtils.extractToken).mockReturnValue('valid-token')
      vi.mocked(authUtils.verifyAccessToken).mockResolvedValue({ sub: 'user-123' })
      vi.mocked(authUtils.getUserIdFromToken).mockReturnValue('user-123')
      vi.mocked(usersService.getUser).mockResolvedValue(mockUser)
      vi.mocked(authUtils.hasPermission).mockReturnValue(true)

      app.use('*', requireEditor)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(200)
    })

    it('should allow admin users', async () => {
      const mockUser = createMockUser({ role: 'admin' })

      vi.mocked(authUtils.extractToken).mockReturnValue('valid-token')
      vi.mocked(authUtils.verifyAccessToken).mockResolvedValue({ sub: 'user-123' })
      vi.mocked(authUtils.getUserIdFromToken).mockReturnValue('user-123')
      vi.mocked(usersService.getUser).mockResolvedValue(mockUser)
      vi.mocked(authUtils.hasPermission).mockReturnValue(true)

      app.use('*', requireEditor)
      app.get('/test', (c) => c.json({ success: true }))

      const res = await app.request('/test', {
        headers: { Authorization: 'Bearer valid-token' },
      })

      expect(res.status).toBe(200)
    })
  })

  describe('requireAuth', () => {
    it('should be an alias for authMiddleware', () => {
      expect(requireAuth).toBe(authMiddleware)
    })
  })

  describe('getUserContext', () => {
    it('should return user context when present', () => {
      const mockContext = {
        get: vi.fn().mockReturnValue({
          userId: 'user-123',
          email: 'test@example.com',
          role: 'editor',
          tokenPayload: {},
        }),
      } as any

      const userContext = getUserContext(mockContext)

      expect(userContext.userId).toBe('user-123')
      expect(userContext.email).toBe('test@example.com')
      expect(userContext.role).toBe('editor')
    })

    it('should throw error when user context not found', () => {
      const mockContext = {
        get: vi.fn().mockReturnValue(undefined),
      } as any

      expect(() => getUserContext(mockContext)).toThrow(
        'User context not found - ensure auth middleware is applied'
      )
    })
  })
})
