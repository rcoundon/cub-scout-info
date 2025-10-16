/**
 * External Link entity types
 */

export type ExternalLinkParentType = 'event' | 'announcement' | 'global';

export interface ExternalLink {
  id: string;
  parent_type: ExternalLinkParentType; // What this link is associated with
  parent_id: string; // ID of event/announcement, or 'none' for global
  url: string;
  label?: string; // Optional display label
  display_order: number; // For sorting links
  is_active: boolean; // For hiding/showing links
  created_by: string; // Cognito user ID
  created_at: string; // ISO 8601 timestamp
  updated_at?: string; // ISO 8601 timestamp
}
