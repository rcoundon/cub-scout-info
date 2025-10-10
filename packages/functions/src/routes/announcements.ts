import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createAnnouncement,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getPublishedAnnouncements,
  getAnnouncementsByStatus,
  expireAnnouncements,
} from '../services/announcements';
import { requireAuth, requireEditor, getUserContext } from '../middleware/auth';

const app = new Hono();

// Validation schemas
const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  expires_at: z.string().datetime().optional(),
  status: z.enum(['draft', 'published', 'expired']).default('draft'),
});

const announcementUpdateSchema = announcementSchema.partial();

/**
 * GET /api/announcements - List all published announcements (public)
 * Returns announcements ordered by priority (highest first)
 * Automatically filters out expired announcements
 */
app.get('/', async (c) => {
  try {
    const announcements = await getPublishedAnnouncements();
    return c.json({ announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return c.json({ error: 'Failed to fetch announcements' }, 500);
  }
});

/**
 * GET /api/announcements/:id - Get single announcement (public)
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const announcement = await getAnnouncement(id);

    if (!announcement) {
      return c.json({ error: 'Announcement not found' }, 404);
    }

    // Only show published announcements to public
    if (announcement.status !== 'published') {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'Announcement not found' }, 404);
      }
    }

    return c.json({ announcement });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    return c.json({ error: 'Failed to fetch announcement' }, 500);
  }
});

/**
 * GET /api/announcements/admin/all - Get all announcements (requires authentication)
 */
app.get('/admin/all', requireAuth, async (c) => {
  try {
    const status = c.req.query('status');

    let announcements;
    if (status) {
      announcements = await getAnnouncementsByStatus(status as any);
    } else {
      // Get all announcements by querying each status
      const [draft, published, expired] = await Promise.all([
        getAnnouncementsByStatus('draft'),
        getAnnouncementsByStatus('published'),
        getAnnouncementsByStatus('expired'),
      ]);
      announcements = [...draft, ...published, ...expired];
    }

    return c.json({ announcements });
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    return c.json({ error: 'Failed to fetch announcements' }, 500);
  }
});

/**
 * POST /api/announcements/admin/expire - Run expiry job (requires editor role)
 * Useful for manual triggering or could be called by a scheduled Lambda
 */
app.post('/admin/expire', requireEditor, async (c) => {
  try {
    const expiredCount = await expireAnnouncements();
    return c.json({
      success: true,
      message: `Expired ${expiredCount} announcement(s)`,
      expiredCount,
    });
  } catch (error) {
    console.error('Error expiring announcements:', error);
    return c.json({ error: 'Failed to expire announcements' }, 500);
  }
});

/**
 * POST /api/announcements - Create new announcement (requires editor role)
 */
app.post(
  '/',
  requireEditor,
  zValidator('json', announcementSchema),
  async (c) => {
    try {
      const user = getUserContext(c);
      const announcementData = c.req.valid('json');

      const announcement = await createAnnouncement({
        ...announcementData,
        created_by: user.userId,
      });

      return c.json(
        {
          success: true,
          announcement,
        },
        201
      );
    } catch (error) {
      console.error('Error creating announcement:', error);
      return c.json(
        {
          error: 'Failed to create announcement',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * PUT /api/announcements/:id - Update announcement (requires editor role)
 */
app.put(
  '/:id',
  requireEditor,
  zValidator('json', announcementUpdateSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const updates = c.req.valid('json');

      // Check if announcement exists
      const existing = await getAnnouncement(id);
      if (!existing) {
        return c.json({ error: 'Announcement not found' }, 404);
      }

      const announcement = await updateAnnouncement(id, updates);

      return c.json({
        success: true,
        announcement,
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      return c.json(
        {
          error: 'Failed to update announcement',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * DELETE /api/announcements/:id - Delete announcement (requires editor role)
 */
app.delete('/:id', requireEditor, async (c) => {
  try {
    const id = c.req.param('id');

    // Check if announcement exists
    const existing = await getAnnouncement(id);
    if (!existing) {
      return c.json({ error: 'Announcement not found' }, 404);
    }

    await deleteAnnouncement(id);

    return c.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return c.json(
      {
        error: 'Failed to delete announcement',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default app;
