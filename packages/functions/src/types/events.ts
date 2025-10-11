/**
 * Event entity types
 */

export type EventType = 'meeting' | 'camp' | 'trip' | 'special' | 'fundraising' | 'other';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'archived';

export type AgeGroup = 'beavers' | 'cubs' | 'scouts';

export interface Event {
  id: string;
  title: string;
  event_type: EventType;
  age_group: AgeGroup;
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
  cancellation_reason?: string; // Reason for cancellation if status is 'cancelled'
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
