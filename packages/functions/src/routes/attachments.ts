import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  generateUploadUrl,
  createAttachment,
  getAttachments,
  getAttachment,
  generateDownloadUrl,
  deleteAttachment,
  validateFile,
} from '../services/attachments';
import { getEvent } from '../services/events';
import { getAnnouncement } from '../services/announcements';
import { requireAuth, requireEditor, getUserContext } from '../middleware/auth';

const app = new Hono();

// Helper function to verify parent exists
async function verifyParent(parentType: 'event' | 'announcement', parentId: string) {
  if (parentType === 'event') {
    return await getEvent(parentId);
  } else {
    return await getAnnouncement(parentId);
  }
}

/**
 * POST /api/:parentType/:parentId/attachments/upload-url
 * Generate a presigned URL for uploading a file
 * Requires editor role
 * parentType: 'events' or 'announcements'
 */
app.post(
  '/:parentType/:parentId/attachments/upload-url',
  requireEditor,
  zValidator(
    'json',
    z.object({
      fileName: z.string().min(1).max(255),
      fileSize: z.number().positive().max(10 * 1024 * 1024), // 10MB max
      fileType: z.string().min(1),
    })
  ),
  async (c) => {
    try {
      const parentTypeParam = c.req.param('parentType');
      const parentId = c.req.param('parentId');
      const { fileName, fileSize, fileType } = c.req.valid('json');
      const user = getUserContext(c);

      // Validate parent type
      if (parentTypeParam !== 'events' && parentTypeParam !== 'announcements') {
        return c.json({ error: 'Invalid parent type' }, 400);
      }

      const parentType = parentTypeParam === 'events' ? 'event' : 'announcement';

      // Verify parent exists
      const parent = await verifyParent(parentType, parentId);
      if (!parent) {
        return c.json({ error: `${parentType === 'event' ? 'Event' : 'Announcement'} not found` }, 404);
      }

      // Validate file
      const validation = validateFile(fileName, fileSize, fileType);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }

      // Generate presigned upload URL
      const { uploadUrl, attachmentId, s3Key } = await generateUploadUrl(
        parentType,
        parentId,
        fileName,
        fileType,
        user.userId
      );

      return c.json({
        success: true,
        uploadUrl,
        attachmentId,
        s3Key,
        expiresIn: 300, // 5 minutes
      });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      return c.json(
        {
          error: 'Failed to generate upload URL',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * POST /api/:parentType/:parentId/attachments
 * Confirm file upload and create attachment metadata
 * Requires editor role
 * parentType: 'events' or 'announcements'
 */
app.post(
  '/:parentType/:parentId/attachments',
  requireEditor,
  zValidator(
    'json',
    z.object({
      attachmentId: z.string().uuid(),
      fileName: z.string().min(1).max(255),
      originalName: z.string().min(1).max(255),
      fileSize: z.number().positive(),
      contentType: z.string().min(1),
      s3Key: z.string().min(1),
    })
  ),
  async (c) => {
    try {
      const parentTypeParam = c.req.param('parentType');
      const parentId = c.req.param('parentId');
      const { attachmentId, fileName, originalName, fileSize, contentType, s3Key } = c.req.valid('json');
      const user = getUserContext(c);

      // Validate parent type
      if (parentTypeParam !== 'events' && parentTypeParam !== 'announcements') {
        return c.json({ error: 'Invalid parent type' }, 400);
      }

      const parentType = parentTypeParam === 'events' ? 'event' : 'announcement';

      // Verify parent exists
      const parent = await verifyParent(parentType, parentId);
      if (!parent) {
        return c.json({ error: `${parentType === 'event' ? 'Event' : 'Announcement'} not found` }, 404);
      }

      // Create attachment metadata
      const attachment = await createAttachment(
        parentType,
        parentId,
        attachmentId,
        fileName,
        originalName,
        fileSize,
        contentType,
        s3Key,
        user.userId
      );

      return c.json(
        {
          success: true,
          attachment,
        },
        201
      );
    } catch (error) {
      console.error('Error creating attachment:', error);
      return c.json(
        {
          error: 'Failed to create attachment',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * GET /api/:parentType/:parentId/attachments
 * List all attachments for a parent (public if parent is published)
 * parentType: 'events' or 'announcements'
 */
app.get('/:parentType/:parentId/attachments', async (c) => {
  try {
    const parentTypeParam = c.req.param('parentType');
    const parentId = c.req.param('parentId');

    // Validate parent type
    if (parentTypeParam !== 'events' && parentTypeParam !== 'announcements') {
      return c.json({ error: 'Invalid parent type' }, 400);
    }

    const parentType = parentTypeParam === 'events' ? 'event' : 'announcement';

    // Verify parent exists
    const parent = await verifyParent(parentType, parentId);
    if (!parent) {
      return c.json({ error: `${parentType === 'event' ? 'Event' : 'Announcement'} not found` }, 404);
    }

    // Get attachments
    const attachments = await getAttachments(parentType, parentId);

    return c.json({ attachments });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return c.json({ error: 'Failed to fetch attachments' }, 500);
  }
});

/**
 * GET /api/attachments/:parentType/:parentId/:attachmentId/download-url
 * Generate presigned download URL (public if parent is published)
 * parentType: 'events' or 'announcements'
 */
app.get('/attachments/:parentType/:parentId/:attachmentId/download-url', async (c) => {
  try {
    const parentTypeParam = c.req.param('parentType');
    const parentId = c.req.param('parentId');
    const attachmentId = c.req.param('attachmentId');

    // Validate parent type
    if (parentTypeParam !== 'events' && parentTypeParam !== 'announcements') {
      return c.json({ error: 'Invalid parent type' }, 400);
    }

    const parentType = parentTypeParam === 'events' ? 'event' : 'announcement';

    // Get attachment
    const attachment = await getAttachment(parentType, parentId, attachmentId);
    if (!attachment) {
      return c.json({ error: 'Attachment not found' }, 404);
    }

    // Verify parent exists
    const parent = await verifyParent(parentType, parentId);
    if (!parent) {
      return c.json({ error: `${parentType === 'event' ? 'Event' : 'Announcement'} not found` }, 404);
    }

    // Generate download URL
    const downloadUrl = await generateDownloadUrl(attachment.s3_key);

    return c.json({
      success: true,
      downloadUrl,
      fileName: attachment.file_name,
      originalName: attachment.original_name,
      fileSize: attachment.file_size,
      contentType: attachment.content_type,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return c.json({ error: 'Failed to generate download URL' }, 500);
  }
});

/**
 * DELETE /api/attachments/:parentType/:parentId/:attachmentId
 * Delete an attachment (requires editor role)
 * parentType: 'events' or 'announcements'
 */
app.delete('/attachments/:parentType/:parentId/:attachmentId', requireEditor, async (c) => {
  try {
    const parentTypeParam = c.req.param('parentType');
    const parentId = c.req.param('parentId');
    const attachmentId = c.req.param('attachmentId');

    // Validate parent type
    if (parentTypeParam !== 'events' && parentTypeParam !== 'announcements') {
      return c.json({ error: 'Invalid parent type' }, 400);
    }

    const parentType = parentTypeParam === 'events' ? 'event' : 'announcement';

    const deleted = await deleteAttachment(parentType, parentId, attachmentId);

    if (!deleted) {
      return c.json({ error: 'Attachment not found' }, 404);
    }

    return c.json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return c.json(
      {
        error: 'Failed to delete attachment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default app;
