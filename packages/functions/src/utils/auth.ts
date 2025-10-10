import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { Resource } from 'sst';
import type { UserRole } from '../types/users';

/**
 * Authentication utilities for JWT validation and user management
 */

// Lazy-initialized JWT verifiers (created on first use)
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;
let idTokenVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: Resource.CubsSiteAuth.id,
      tokenUse: 'access',
      clientId: process.env.USER_POOL_CLIENT_ID,
    });
  }
  return verifier;
}

function getIdTokenVerifier() {
  if (!idTokenVerifier) {
    idTokenVerifier = CognitoJwtVerifier.create({
      userPoolId: Resource.CubsSiteAuth.id,
      tokenUse: 'id',
      clientId: process.env.USER_POOL_CLIENT_ID,
    });
  }
  return idTokenVerifier;
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and just "<token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }

  return null;
}

/**
 * Verify and decode an access token
 * Returns the payload if valid, throws error if invalid
 */
export async function verifyAccessToken(token: string) {
  try {
    const payload = await getVerifier().verify(token);
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify and decode an ID token
 * Returns the payload with user attributes
 */
export async function verifyIdToken(token: string) {
  try {
    const payload = await getIdTokenVerifier().verify(token);
    return payload;
  } catch (error) {
    console.error('ID token verification failed:', error);
    throw new Error('Invalid or expired ID token');
  }
}

/**
 * Get user ID from verified token payload
 */
export function getUserIdFromToken(payload: any): string {
  return payload.sub || payload['cognito:username'];
}

/**
 * Get email from verified ID token payload
 */
export function getEmailFromToken(payload: any): string | undefined {
  return payload.email;
}

/**
 * Type guard for checking user role
 */
export function isValidRole(role: string): role is UserRole {
  return ['admin', 'editor', 'viewer'].includes(role);
}

/**
 * Check if a role has permission for an action
 *
 * Permission hierarchy:
 * - admin: Full access (create, read, update, delete, manage users)
 * - editor: Create, read, update, delete content (events, announcements)
 * - viewer: Read-only access
 */
export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(
  userRole: UserRole,
  action: 'read' | 'write' | 'delete' | 'manage-users'
): boolean {
  switch (action) {
    case 'read':
      return hasPermission(userRole, 'viewer');
    case 'write':
      return hasPermission(userRole, 'editor');
    case 'delete':
      return hasPermission(userRole, 'editor');
    case 'manage-users':
      return hasPermission(userRole, 'admin');
    default:
      return false;
  }
}

/**
 * User context type for authenticated requests
 */
export interface UserContext {
  userId: string;
  email?: string;
  role: UserRole;
  tokenPayload: any;
}
