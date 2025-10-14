import { EventEntity } from '../db/entities';
import type { Event, EventStatus, EventType } from '../types/events';
import { getUser } from './users';

/**
 * Events Service using ElectroDB
 */

/**
 * Enrich event with creator information
 */
async function enrichEventWithCreator(event: Event) {
  try {
    const creator = await getUser(event.created_by);
    return {
      ...event,
      creator_name: creator ? `${creator.first_name} ${creator.last_name}` : 'Unknown',
    };
  } catch (error) {
    console.error('Failed to fetch creator:', error);
    return {
      ...event,
      creator_name: 'Unknown',
    };
  }
}

/**
 * Enrich multiple events with creator information
 */
async function enrichEventsWithCreators(events: Event[]) {
  return Promise.all(events.map(enrichEventWithCreator));
}

/**
 * Parse recurrence rule and expand recurring events into individual occurrences
 */
function expandRecurringEvent(event: Event): Event[] {
  if (!event.is_recurring || !event.recurrence_rule) {
    return [event];
  }

  const occurrences: Event[] = [];
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const duration = endDate.getTime() - startDate.getTime();

  // Parse recurrence rule (format: FREQ=WEEKLY;UNTIL=20260101)
  const freqMatch = event.recurrence_rule.match(/FREQ=(\w+)/);
  const untilMatch = event.recurrence_rule.match(/UNTIL=(\d{8})/);

  if (!freqMatch || !untilMatch) {
    return [event];
  }

  const frequency = freqMatch[1];
  const untilStr = untilMatch[1];
  const untilDate = new Date(
    parseInt(untilStr.substring(0, 4)),
    parseInt(untilStr.substring(4, 6)) - 1,
    parseInt(untilStr.substring(6, 8))
  );

  let currentDate = new Date(startDate);
  let occurrenceCount = 0;
  const maxOccurrences = 1000; // Safety limit

  while (currentDate <= untilDate && occurrenceCount < maxOccurrences) {
    const occurrenceStart = new Date(currentDate);
    const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

    occurrences.push({
      ...event,
      id: `${event.id}_${occurrenceStart.toISOString().split('T')[0]}`,
      start_date: occurrenceStart.toISOString(),
      end_date: occurrenceEnd.toISOString(),
    });

    // Increment based on frequency
    switch (frequency) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        return [event];
    }

    occurrenceCount++;
  }

  return occurrences;
}

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
  if (!result.data) return null;

  return enrichEventWithCreator(result.data);
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
 * Get all published events ordered by date (without expanding recurring)
 * Returns master records for display in lists
 */
export async function getPublishedEvents() {
  const result = await EventEntity.query.byStatus({ status: 'published' }).go();
  const sorted = result.data.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  return enrichEventsWithCreators(sorted);
}

/**
 * Get all public events (published + cancelled) ordered by date
 * Cancelled events are shown with visual indicators
 * Returns master records for display in lists
 */
export async function getPublicEvents() {
  const [published, cancelled] = await Promise.all([
    EventEntity.query.byStatus({ status: 'published' }).go(),
    EventEntity.query.byStatus({ status: 'cancelled' }).go(),
  ]);

  const sorted = [...published.data, ...cancelled.data].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  return enrichEventsWithCreators(sorted);
}

/**
 * Get all published events with recurring events expanded
 * Used for calendar feeds where we need all individual occurrences
 */
export async function getPublishedEventsExpanded() {
  const result = await EventEntity.query.byStatus({ status: 'published' }).go();
  const events = result.data;

  // Expand recurring events
  const expandedEvents: Event[] = [];
  for (const event of events) {
    expandedEvents.push(...expandRecurringEvent(event));
  }

  // Sort by start date
  return expandedEvents.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
}

/**
 * Get events by status without expanding recurring events
 * Used for admin views where you want to see the master recurring event
 */
export async function getEventsByStatusRaw(status: EventStatus) {
  const result = await EventEntity.query.byStatus({ status }).go();
  const sorted = result.data.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  return enrichEventsWithCreators(sorted);
}

/**
 * Get events by status
 * Expands recurring events into individual occurrences
 * Used for public-facing views
 */
export async function getEventsByStatus(status: EventStatus) {
  const result = await EventEntity.query.byStatus({ status }).go();
  const events = result.data;

  // Expand recurring events
  const expandedEvents: Event[] = [];
  for (const event of events) {
    expandedEvents.push(...expandRecurringEvent(event));
  }

  // Sort by start date
  return expandedEvents.sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
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
