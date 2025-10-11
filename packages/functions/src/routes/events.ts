import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  getPublishedEvents,
  getPublicEvents,
  getPublishedEventsExpanded,
  getEventsByStatus,
  getEventsByStatusRaw,
  duplicateEvent,
} from '../services/events';
import { requireAuth, requireEditor, getUserContext } from '../middleware/auth';
import { generateICalEvent, generateICalFeed } from '../utils/icalendar';

const app = new Hono();

// Validation schemas
const eventSchema = z.object({
  title: z.string().min(1).max(200),
  event_type: z.enum(['meeting', 'camp', 'trip', 'special', 'other']),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  location: z.string().min(1).max(500),
  description: z.string().min(1),
  cost: z.number().min(0).optional(),
  what_to_bring: z.string().optional(),
  rsvp_deadline: z.string().datetime().optional(),
  organizer_name: z.string().max(100).optional(),
  organizer_contact: z.string().max(200).optional(),
  is_recurring: z.boolean().default(false),
  recurrence_rule: z.string().optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'archived']).default('draft'),
  cancellation_reason: z.string().max(500).optional(),
});

const eventUpdateSchema = eventSchema.partial();

/**
 * GET /api/events - List all public events (published + cancelled) (public)
 */
app.get('/', async (c) => {
  try {
    const events = await getPublicEvents();
    return c.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

/**
 * GET /api/events/calendar.ics - Export all published events as iCalendar feed
 * IMPORTANT: This must come BEFORE /:id to avoid matching "calendar" as an ID
 */
app.get('/calendar.ics', async (c) => {
  try {
    // Use expanded version for calendar feeds to include all recurring occurrences
    const events = await getPublishedEventsExpanded();

    // Filter to only include upcoming and recent events (last 30 days, future events)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const relevantEvents = events.filter((event) => {
      const eventDate = new Date(event.end_date);
      return eventDate >= thirtyDaysAgo;
    });

    const icalContent = generateICalFeed(relevantEvents);

    return c.body(icalContent, 200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="cubs-events-calendar.ics"',
    });
  } catch (error) {
    console.error('Error exporting calendar:', error);
    return c.json({ error: 'Failed to export calendar' }, 500);
  }
});

/**
 * GET /api/events/admin/all - Get all events (requires authentication)
 * IMPORTANT: This must come BEFORE /:id to avoid matching "admin" as an ID
 * Returns raw events without expanding recurring events (for admin management)
 */
app.get('/admin/all', requireAuth, async (c) => {
  try {
    const status = c.req.query('status');

    let events;
    if (status) {
      events = await getEventsByStatusRaw(status as any);
    } else {
      // Get all events by querying each status (without expansion)
      const [draft, published, cancelled, archived] = await Promise.all([
        getEventsByStatusRaw('draft'),
        getEventsByStatusRaw('published'),
        getEventsByStatusRaw('cancelled'),
        getEventsByStatusRaw('archived'),
      ]);
      events = [...draft, ...published, ...cancelled, ...archived];
    }

    return c.json({ events });
  } catch (error) {
    console.error('Error fetching all events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

/**
 * GET /api/events/:id - Get single event (public)
 */
app.get('/:id', async (c) => {
  try {
    let id = c.req.param('id');

    // Check if this is an expanded recurring event ID (format: originalId_YYYY-MM-DD)
    let targetDate: string | null = null;
    if (id.includes('_')) {
      const parts = id.split('_');
      if (parts.length === 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
        // This is an expanded occurrence, extract original ID and date
        id = parts[0];
        targetDate = parts[1];
      }
    }

    const event = await getEvent(id);

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Show published and cancelled events to public
    // Authenticated users can see drafts and archived if they're editors
    if (event.status !== 'published' && event.status !== 'cancelled') {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Event not found' }, 404);
      }
    }

    // If this is a specific occurrence of a recurring event, modify the dates
    if (targetDate && event.is_recurring) {
      const originalStart = new Date(event.start_date);
      const originalEnd = new Date(event.end_date);
      const duration = originalEnd.getTime() - originalStart.getTime();

      // Create the occurrence at the target date
      const occurrenceStart = new Date(targetDate);
      occurrenceStart.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds());

      const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

      // Return the event with the specific occurrence dates
      return c.json({
        event: {
          ...event,
          id: `${event.id}_${targetDate}`,
          start_date: occurrenceStart.toISOString(),
          end_date: occurrenceEnd.toISOString(),
        },
      });
    }

    return c.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return c.json({ error: 'Failed to fetch event' }, 500);
  }
});

/**
 * POST /api/events - Create new event (requires editor role)
 */
app.post(
  '/',
  requireEditor,
  zValidator('json', eventSchema),
  async (c) => {
    try {
      const user = getUserContext(c);
      const eventData = c.req.valid('json');

      const event = await createEvent({
        ...eventData,
        created_by: user.userId,
      });

      return c.json(
        {
          success: true,
          event,
        },
        201
      );
    } catch (error) {
      console.error('Error creating event:', error);
      return c.json(
        {
          error: 'Failed to create event',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * PUT /api/events/:id - Update event (requires editor role)
 */
app.put(
  '/:id',
  requireEditor,
  zValidator('json', eventUpdateSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const updates = c.req.valid('json');

      // Check if event exists
      const existing = await getEvent(id);
      if (!existing) {
        return c.json({ error: 'Event not found' }, 404);
      }

      const event = await updateEvent(id, updates);

      return c.json({
        success: true,
        event,
      });
    } catch (error) {
      console.error('Error updating event:', error);
      return c.json(
        {
          error: 'Failed to update event',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * DELETE /api/events/:id - Delete event (requires editor role)
 */
app.delete('/:id', requireEditor, async (c) => {
  try {
    const id = c.req.param('id');

    // Check if event exists
    const existing = await getEvent(id);
    if (!existing) {
      return c.json({ error: 'Event not found' }, 404);
    }

    await deleteEvent(id);

    return c.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return c.json(
      {
        error: 'Failed to delete event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/events/:id/duplicate - Duplicate event (requires editor role)
 */
app.post('/:id/duplicate', requireEditor, async (c) => {
  try {
    const id = c.req.param('id');

    const event = await duplicateEvent(id);

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    return c.json(
      {
        success: true,
        event,
      },
      201
    );
  } catch (error) {
    console.error('Error duplicating event:', error);
    return c.json(
      {
        error: 'Failed to duplicate event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/events/:id/export.ics - Export single event as iCalendar file
 */
app.get('/:id/export.ics', async (c) => {
  try {
    let id = c.req.param('id');

    // Handle expanded recurring event IDs
    if (id.includes('_')) {
      const parts = id.split('_');
      if (parts.length === 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
        id = parts[0];
      }
    }

    const event = await getEvent(id);

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Only export published and cancelled events
    if (event.status !== 'published' && event.status !== 'cancelled') {
      return c.json({ error: 'Event not found' }, 404);
    }

    const icalContent = generateICalEvent(event);
    const fileName = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;

    return c.body(icalContent, 200, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
  } catch (error) {
    console.error('Error exporting event:', error);
    return c.json({ error: 'Failed to export event' }, 500);
  }
});

export default app;
