import { EventEntity } from '../db/entities';
import type { Event, EventStatus, EventType } from '../types/events';

/**
 * Events Service using ElectroDB
 */

/**
 * Create a new event
 */
export async function createEvent(
  eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>
) {
  const result = await EventEntity.create(eventData).go();
  return result.data;
}

/**
 * Get an event by ID
 */
export async function getEvent(id: string) {
  const result = await EventEntity.get({ id }).go();
  return result.data || null;
}

/**
 * Update an event
 */
export async function updateEvent(
  id: string,
  updates: Partial<Omit<Event, 'id' | 'created_at' | 'created_by'>>
) {
  const result = await EventEntity.patch({ id }).set(updates).go({ response: 'all_new' });
  return result.data || null;
}

/**
 * Delete an event
 */
export async function deleteEvent(id: string) {
  await EventEntity.delete({ id }).go();
}

/**
 * Get all published events ordered by date
 */
export async function getPublishedEvents() {
  const result = await EventEntity.query.byStatus({ status: 'published' }).go();
  return result.data;
}

/**
 * Get events by status
 */
export async function getEventsByStatus(status: EventStatus) {
  const result = await EventEntity.query.byStatus({ status }).go();
  return result.data;
}

/**
 * Get events by type in date range
 */
export async function getEventsByType(
  event_type: EventType,
  startDate: string,
  endDate: string
) {
  const result = await EventEntity.query
    .byType({ event_type })
    .between({ start_date: startDate }, { start_date: endDate })
    .go();
  return result.data;
}

/**
 * Duplicate an event (creates a copy with a new ID)
 */
export async function duplicateEvent(id: string) {
  const original = await getEvent(id);

  if (!original) {
    return null;
  }

  // Remove id, created_at, updated_at from the original
  const { id: _id, created_at, updated_at, ...eventData } = original;

  // Create new event with "Copy of" prefix
  const result = await EventEntity.create({
    ...eventData,
    title: `Copy of ${eventData.title}`,
    status: 'draft', // New events start as drafts
  }).go();

  return result.data;
}
