/**
 * User entity types
 */

export type UserRole = 'admin' | 'editor' | 'viewer';
export type InvitationStatus = 'invited' | 'active' | 'expired';

export interface User {
  id: string; // Cognito user ID or temporary ID for invited users
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  last_login?: string; // ISO 8601 timestamp
  invitation_token?: string; // Secure token for invitation acceptance
  invitation_token_expires?: string; // ISO 8601 timestamp
  invitation_status: InvitationStatus; // Current status of invitation/account
  invited_at?: string; // ISO 8601 timestamp of when invitation was sent
}
