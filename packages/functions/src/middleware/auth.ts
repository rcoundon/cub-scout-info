import { createMiddleware } from 'hono/factory';
import type { Context } from 'hono';
import {
  extractToken,
  verifyAccessToken,
  getUserIdFromToken,
  hasPermission,
  type UserContext,
} from '../utils/auth';
import { getUser } from '../services/users';
import type { UserRole } from '../types/users';

/**
 * Authentication middleware
 * Verifies JWT token and adds user context to the request
 */
export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return c.json({ error: 'Missing authentication token' }, 401);
  }

  try {
    // Verify the JWT token
    const payload = await verifyAccessToken(token);
    const userId = getUserIdFromToken(payload);

    // Fetch user from database to get role
    const user = await getUser(userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Add user context to the request
    const userContext: UserContext = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenPayload: payload,
    };

    c.set('user', userContext);

    return await next();
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json(
      {
        error: 'Invalid or expired token',
        message: error instanceof Error ? error.message : 'Authentication failed',
      },
      401
    );
  }
});

/**
 * Role-based access control middleware
 * Requires a minimum role level to access the endpoint
 */
export function requireRole(minimumRole: UserRole) {
  return createMiddleware(async (c, next) => {
    const user = c.get('user') as UserContext | undefined;

    if (!user) {
      return c.json({ error: 'Unauthorized: User context not found' }, 401);
    }

    if (!hasPermission(user.role, minimumRole)) {
      return c.json(
        {
          error: 'Forbidden: Insufficient permissions',
          required: minimumRole,
          current: user.role,
        },
        403
      );
    }

    return await next();
  });
}

/**
 * Combined authentication + authorization middleware
 * This properly chains auth and role checking
 */
function createAuthAndRoleMiddleware(minimumRole: UserRole) {
  return createMiddleware(async (c, next) => {
    // Extract and verify token
    const authHeader = c.req.header('Authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return c.json({ error: 'Missing authentication token' }, 401);
    }

    try {
      // Verify the JWT token
      const payload = await verifyAccessToken(token);
      const userId = getUserIdFromToken(payload);

      // Fetch user from database to get role
      const user = await getUser(userId);

      if (!user) {
        return c.json({ error: 'User not found' }, 404);
      }

      // Check role permission
      if (!hasPermission(user.role, minimumRole)) {
        return c.json(
          {
            error: 'Forbidden: Insufficient permissions',
            required: minimumRole,
            current: user.role,
          },
          403
        );
      }

      // Add user context to the request
      const userContext: UserContext = {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenPayload: payload,
      };

      c.set('user', userContext);

      return await next();
    } catch (error) {
      console.error('Authentication error:', error);
      return c.json(
        {
          error: 'Invalid or expired token',
          message: error instanceof Error ? error.message : 'Authentication failed',
        },
        401
      );
    }
  });
}

/**
 * Convenience middleware for admin-only endpoints
 */
export const requireAdmin = createAuthAndRoleMiddleware('admin');

/**
 * Convenience middleware for editor or higher
 */
export const requireEditor = createAuthAndRoleMiddleware('editor');

/**
 * Convenience middleware for any authenticated user
 */
export const requireAuth = authMiddleware;

/**
 * Helper to get user context from Hono context
 */
export function getUserContext(c: Context): UserContext {
  const user = c.get('user') as UserContext;
  if (!user) {
    throw new Error('User context not found - ensure auth middleware is applied');
  }
  return user;
}
