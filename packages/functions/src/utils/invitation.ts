import crypto from 'crypto';

/**
 * Invitation Token Utilities
 * Handles secure token generation and validation for user invitations
 */

/**
 * Generate a cryptographically secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Hex-encoded secure random token
 */
export function generateInvitationToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Calculate expiration date for invitation token
 * @param hours - Number of hours until expiration (default: 72 hours / 3 days)
 * @returns ISO 8601 timestamp of expiration
 */
export function calculateTokenExpiration(hours: number = 72): string {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + hours);
  return expirationDate.toISOString();
}

/**
 * Check if an invitation token has expired
 * @param expirationDate - ISO 8601 timestamp of token expiration
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(expirationDate: string): boolean {
  return new Date(expirationDate) < new Date();
}

/**
 * Validate invitation token format
 * @param token - Token to validate
 * @returns true if token format is valid
 */
export function isValidTokenFormat(token: string): boolean {
  // Token should be 64 characters hex string (32 bytes)
  return /^[a-f0-9]{64}$/i.test(token);
}

/**
 * Generate a temporary user ID for invited users (before Cognito account creation)
 * Format: INVITED_timestamp_random
 * Note: Using underscores instead of # to avoid URL routing issues
 */
export function generateTemporaryUserId(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `INVITED_${timestamp}_${random}`;
}
