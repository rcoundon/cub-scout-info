import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  generateUploadUrl,
  createAttachment,
  getEventAttachments,
  getAttachment,
  generateDownloadUrl,
  deleteAttachment,
  validateFile,
} from '../services/attachments';
import { getEvent } from '../services/events';
import { requireAuth, requireEditor, getUserContext } from '../middleware/auth';

const app = new Hono();

/**
 * POST /api/events/:eventId/attachments/upload-url
 * Generate a presigned URL for uploading a file
 * Requires editor role
 */
app.post(
  '/events/:eventId/attachments/upload-url',
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
      const eventId = c.req.param('eventId');
      const { fileName, fileSize, fileType } = c.req.valid('json');
      const user = getUserContext(c);

      // Verify event exists
      const event = await getEvent(eventId);
      if (!event) {
        return c.json({ error: 'Event not found' }, 404);
      }

      // Validate file
      const validation = validateFile(fileName, fileSize, fileType);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }

      // Generate presigned upload URL
      const { uploadUrl, attachmentId, s3Key } = await generateUploadUrl(
        eventId,
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
 * POST /api/events/:eventId/attachments
 * Confirm file upload and create attachment metadata
 * Requires editor role
 */
app.post(
  '/events/:eventId/attachments',
  requireEditor,
  zValidator(
    'json',
    z.object({
      attachmentId: z.string().uuid(),
      fileName: z.string().min(1).max(255),
      fileSize: z.number().positive(),
      fileType: z.string().min(1),
      s3Key: z.string().min(1),
    })
  ),
  async (c) => {
    try {
      const eventId = c.req.param('eventId');
      const { attachmentId, fileName, fileSize, fileType, s3Key } = c.req.valid('json');
      const user = getUserContext(c);

      // Verify event exists
      const event = await getEvent(eventId);
      if (!event) {
        return c.json({ error: 'Event not found' }, 404);
      }

      // Create attachment metadata
      const attachment = await createAttachment(
        eventId,
        attachmentId,
        fileName,
        fileSize,
        fileType,
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
 * GET /api/events/:eventId/attachments
 * List all attachments for an event (public if event is published)
 */
app.get('/events/:eventId/attachments', async (c) => {
  try {
    const eventId = c.req.param('eventId');

    // Verify event exists
    const event = await getEvent(eventId);
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Get attachments
    const attachments = await getEventAttachments(eventId);

    return c.json({ attachments });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return c.json({ error: 'Failed to fetch attachments' }, 500);
  }
});

/**
 * GET /api/attachments/:eventId/:attachmentId/download-url
 * Generate presigned download URL (public if event is published)
 */
app.get('/attachments/:eventId/:attachmentId/download-url', async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const attachmentId = c.req.param('attachmentId');

    // Get attachment
    const attachment = await getAttachment(eventId, attachmentId);
    if (!attachment) {
      return c.json({ error: 'Attachment not found' }, 404);
    }

    // Verify event exists
    const event = await getEvent(eventId);
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }

    // Generate download URL
    const downloadUrl = await generateDownloadUrl(attachment.s3_key);

    return c.json({
      success: true,
      downloadUrl,
      fileName: attachment.file_name,
      fileSize: attachment.file_size,
      fileType: attachment.file_type,
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return c.json({ error: 'Failed to generate download URL' }, 500);
  }
});

/**
 * DELETE /api/attachments/:eventId/:attachmentId
 * Delete an attachment (requires editor role)
 */
app.delete('/attachments/:eventId/:attachmentId', requireEditor, async (c) => {
  try {
    const eventId = c.req.param('eventId');
    const attachmentId = c.req.param('attachmentId');

    const deleted = await deleteAttachment(eventId, attachmentId);

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
