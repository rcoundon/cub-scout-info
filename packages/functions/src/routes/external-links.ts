import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createExternalLink,
  getExternalLink,
  updateExternalLink,
  deleteExternalLink,
  getActiveGlobalExternalLinks,
  getAllGlobalExternalLinks,
  getEventExternalLinks,
  getAnnouncementExternalLinks,
  reorderExternalLinks,
} from '../services/external-links';
import { requireAuth, requireEditor, getUserContext } from '../middleware/auth';

const app = new Hono();

// Validation schemas
const externalLinkSchema = z.object({
  parent_type: z.enum(['event', 'announcement', 'global']).default('global'),
  parent_id: z.string().default('none'),
  url: z.string().url().min(1).max(2000),
  label: z.string().max(200).optional(),
  display_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

const externalLinkUpdateSchema = externalLinkSchema.partial();

const reorderSchema = z.object({
  links: z.array(
    z.object({
      id: z.string(),
      display_order: z.number().int().min(0),
    })
  ),
});

/**
 * GET /api/external-links - Get all active global external links (public)
 */
app.get('/', async (c) => {
  try {
    const links = await getActiveGlobalExternalLinks();
    return c.json({ links });
  } catch (error) {
    console.error('Error fetching external links:', error);
    return c.json({ error: 'Failed to fetch external links' }, 500);
  }
});

/**
 * GET /api/external-links/admin/all - Get all global external links (requires authentication)
 */
app.get('/admin/all', requireAuth, async (c) => {
  try {
    const links = await getAllGlobalExternalLinks();
    return c.json({ links });
  } catch (error) {
    console.error('Error fetching all external links:', error);
    return c.json({ error: 'Failed to fetch external links' }, 500);
  }
});

/**
 * GET /api/external-links/event/:eventId - Get external links for an event
 */
app.get('/event/:eventId', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const links = await getEventExternalLinks(eventId);
    return c.json({ links });
  } catch (error) {
    console.error('Error fetching event external links:', error);
    return c.json({ error: 'Failed to fetch external links' }, 500);
  }
});

/**
 * GET /api/external-links/announcement/:announcementId - Get external links for an announcement
 */
app.get('/announcement/:announcementId', async (c) => {
  try {
    const announcementId = c.req.param('announcementId');
    const links = await getAnnouncementExternalLinks(announcementId);
    return c.json({ links });
  } catch (error) {
    console.error('Error fetching announcement external links:', error);
    return c.json({ error: 'Failed to fetch external links' }, 500);
  }
});

/**
 * GET /api/external-links/:id - Get single external link (public)
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const link = await getExternalLink(id);

    if (!link) {
      return c.json({ error: 'External link not found' }, 404);
    }

    // Only show active links to public
    if (!link.is_active) {
      const authHeader = c.req.header('Authorization');
      if (!authHeader) {
        return c.json({ error: 'External link not found' }, 404);
      }
    }

    return c.json({ link });
  } catch (error) {
    console.error('Error fetching external link:', error);
    return c.json({ error: 'Failed to fetch external link' }, 500);
  }
});

/**
 * POST /api/external-links - Create new external link (requires editor role)
 */
app.post(
  '/',
  requireEditor,
  zValidator('json', externalLinkSchema),
  async (c) => {
    try {
      const user = getUserContext(c);
      const linkData = c.req.valid('json');

      const link = await createExternalLink({
        ...linkData,
        created_by: user.userId,
      });

      return c.json(
        {
          success: true,
          link,
        },
        201
      );
    } catch (error) {
      console.error('Error creating external link:', error);
      return c.json(
        {
          error: 'Failed to create external link',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * PUT /api/external-links/:id - Update external link (requires editor role)
 */
app.put(
  '/:id',
  requireEditor,
  zValidator('json', externalLinkUpdateSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const updates = c.req.valid('json');

      // Check if link exists
      const existing = await getExternalLink(id);
      if (!existing) {
        return c.json({ error: 'External link not found' }, 404);
      }

      const link = await updateExternalLink(id, updates);

      return c.json({
        success: true,
        link,
      });
    } catch (error) {
      console.error('Error updating external link:', error);
      return c.json(
        {
          error: 'Failed to update external link',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * DELETE /api/external-links/:id - Delete external link (requires editor role)
 */
app.delete('/:id', requireEditor, async (c) => {
  try {
    const id = c.req.param('id');

    // Check if link exists
    const existing = await getExternalLink(id);
    if (!existing) {
      return c.json({ error: 'External link not found' }, 404);
    }

    await deleteExternalLink(id);

    return c.json({
      success: true,
      message: 'External link deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting external link:', error);
    return c.json(
      {
        error: 'Failed to delete external link',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/external-links/reorder - Reorder external links (requires editor role)
 */
app.post(
  '/reorder',
  requireEditor,
  zValidator('json', reorderSchema),
  async (c) => {
    try {
      const { links } = c.req.valid('json');

      await reorderExternalLinks(links);

      return c.json({
        success: true,
        message: 'External links reordered successfully',
      });
    } catch (error) {
      console.error('Error reordering external links:', error);
      return c.json(
        {
          error: 'Failed to reorder external links',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

export default app;
