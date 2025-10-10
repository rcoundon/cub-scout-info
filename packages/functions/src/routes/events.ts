import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  getPublishedEvents,
  getEventsByStatus,
  duplicateEvent,
} from '../services/events';
import { requireAuth, requireEditor, getUserContext } from '../middleware/auth';

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
});

const eventUpdateSchema = eventSchema.partial();

/**
 * GET /api/events - List all published events (public)
 */
app.get('/', async (c) => {
  try {
    const events = await getPublishedEvents();
    return c.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

/**
 * GET /api/events/admin/all - Get all events (requires authentication)
 * IMPORTANT: This must come BEFORE /:id to avoid matching "admin" as an ID
 */
app.get('/admin/all', requireAuth, async (c) => {
  try {
    const status = c.req.query('status');

    let events;
    if (status) {
      events = await getEventsByStatus(status as any);
    } else {
      // Get all events by querying each status
      const [draft, published, cancelled, archived] = await Promise.all([
        getEventsByStatus('draft'),
        getEventsByStatus('published'),
        getEventsByStatus('cancelled'),
        getEventsByStatus('archived'),
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
    const id = c.req.param('id');
    const event = await getEvent(id);

    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Only show published events to public
    // Authenticated users can see drafts if they're editors
    if (event.status !== 'published') {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Event not found' }, 404);
      }
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

export default app;
