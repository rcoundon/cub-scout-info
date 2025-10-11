/**
 * Announcement entity types
 */

export type AnnouncementStatus = 'draft' | 'published' | 'expired';
export type AnnouncementPriority = 'low' | 'medium' | 'high';
export type AnnouncementCategory = 'general' | 'event' | 'fundraising' | 'urgent' | 'achievement';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  category?: AnnouncementCategory;
  expires_at?: string; // ISO 8601 format
  status: AnnouncementStatus;
  created_by: string; // Cognito user ID
  created_at: string; // ISO 8601 timestamp
  updated_at?: string; // ISO 8601 timestamp
}
