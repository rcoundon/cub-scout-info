/**
 * User entity types
 */

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string; // Cognito user ID
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  last_login?: string; // ISO 8601 timestamp
}
