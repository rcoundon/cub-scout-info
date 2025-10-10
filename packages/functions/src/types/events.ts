/**
 * Event entity types
 */

export type EventType = 'meeting' | 'camp' | 'trip' | 'special' | 'other';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'archived';

export interface Event {
  id: string;
  title: string;
  event_type: EventType;
  start_date: string; // ISO 8601 format
  end_date: string; // ISO 8601 format
  location: string;
  description: string;
  cost?: number;
  what_to_bring?: string;
  rsvp_deadline?: string; // ISO 8601 format
  organizer_name?: string;
  organizer_contact?: string;
  is_recurring: boolean;
  recurrence_rule?: string; // iCal RRULE format
  status: EventStatus;
  created_by: string; // Cognito user ID
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

export interface EventAttachment {
  id: string;
  event_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  s3_key: string;
  uploaded_by: string; // Cognito user ID
  uploaded_at: string; // ISO 8601 timestamp
}
