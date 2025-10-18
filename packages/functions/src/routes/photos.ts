import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createPhoto,
  getPhoto,
  updatePhoto,
  deletePhoto,
  permanentlyDeletePhoto,
  getActivePhotos,
  getAllPhotos,
  reorderPhotos,
  generatePhotoUrl,
} from '../services/photos';
import { requireAuth, requireEditor, getUserContext } from '../middleware/auth';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Resource } from 'sst';

const app = new Hono();
const s3Client = new S3Client({});

// Validation schemas
const uploadUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().min(1).max(10 * 1024 * 1024), // 10MB max
});

const createPhotoSchema = z.object({
  s3_key: z.string().min(1),
  caption: z.string().min(1).max(500),
  file_size: z.number().min(1),
  content_type: z.string().min(1),
  display_order: z.number().min(0).optional(),
});

const updatePhotoSchema = z.object({
  caption: z.string().min(1).max(500).optional(),
  display_order: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
});

const reorderSchema = z.object({
  photos: z.array(
    z.object({
      id: z.string(),
      display_order: z.number().min(0),
    })
  ),
});

/**
 * Validate image file type and size
 */
function validateImageFile(fileName: string, fileSize: number, fileType: string) {
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (fileSize > maxFileSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  if (!allowedTypes.includes(fileType.toLowerCase())) {
    return { valid: false, error: 'File type not allowed. Allowed types: JPEG, PNG, GIF, WebP' };
  }

  return { valid: true };
}

/**
 * GET /api/photos - List all active photos (public)
 */
app.get('/', async (c) => {
  try {
    const photos = await getActivePhotos();
    return c.json({ photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return c.json({ error: 'Failed to fetch photos' }, 500);
  }
});

/**
 * GET /api/photos/admin/all - Get all photos (requires authentication)
 */
app.get('/admin/all', requireAuth, async (c) => {
  try {
    const photos = await getAllPhotos();
    return c.json({ photos });
  } catch (error) {
    console.error('Error fetching all photos:', error);
    return c.json({ error: 'Failed to fetch photos' }, 500);
  }
});

/**
 * GET /api/photos/:id - Get single photo
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const photo = await getPhoto(id);

    if (!photo) {
      return c.json({ error: 'Photo not found' }, 404);
    }

    return c.json({ photo });
  } catch (error) {
    console.error('Error fetching photo:', error);
    return c.json({ error: 'Failed to fetch photo' }, 500);
  }
});

/**
 * POST /api/photos/upload-url - Generate presigned URL for photo upload (requires editor role)
 */
app.post(
  '/upload-url',
  requireEditor,
  zValidator('json', uploadUrlSchema),
  async (c) => {
    try {
      const { fileName, fileType, fileSize } = c.req.valid('json');

      // Validate file
      const validation = validateImageFile(fileName, fileSize, fileType);
      if (!validation.valid) {
        return c.json({ error: validation.error }, 400);
      }

      // Generate unique ID and S3 key
      const photoId = crypto.randomUUID();
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Key = `photos/${timestamp}-${photoId}-${sanitizedFileName}`;

      // Create presigned URL for upload (expires in 5 minutes)
      const command = new PutObjectCommand({
        Bucket: Resource.PhotosBucket.name,
        Key: s3Key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

      return c.json({
        uploadUrl,
        s3Key,
        photoId,
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
 * POST /api/photos - Create new photo metadata after upload (requires editor role)
 */
app.post(
  '/',
  requireEditor,
  zValidator('json', createPhotoSchema),
  async (c) => {
    try {
      const user = getUserContext(c);
      const photoData = c.req.valid('json');

      const photo = await createPhoto({
        ...photoData,
        uploaded_by: user.userId,
      });

      // Generate presigned URL for the newly created photo
      const photoWithUrl = {
        ...photo,
        url: await generatePhotoUrl(photo.s3_key),
      };

      return c.json(
        {
          success: true,
          photo: photoWithUrl,
        },
        201
      );
    } catch (error) {
      console.error('Error creating photo:', error);
      return c.json(
        {
          error: 'Failed to create photo',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * PUT /api/photos/:id - Update photo (requires editor role)
 */
app.put(
  '/:id',
  requireEditor,
  zValidator('json', updatePhotoSchema),
  async (c) => {
    try {
      const id = c.req.param('id');
      const updates = c.req.valid('json');

      // Check if photo exists
      const existing = await getPhoto(id);
      if (!existing) {
        return c.json({ error: 'Photo not found' }, 404);
      }

      const photo = await updatePhoto(id, updates);

      return c.json({
        success: true,
        photo,
      });
    } catch (error) {
      console.error('Error updating photo:', error);
      return c.json(
        {
          error: 'Failed to update photo',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * DELETE /api/photos/:id - Delete photo (requires editor role)
 * Soft deletes by default (sets is_active to false)
 * Use ?permanent=true to hard delete and remove from S3
 */
app.delete('/:id', requireEditor, async (c) => {
  try {
    const id = c.req.param('id');
    const permanent = c.req.query('permanent') === 'true';

    // Check if photo exists
    const existing = await getPhoto(id);
    if (!existing) {
      return c.json({ error: 'Photo not found' }, 404);
    }

    if (permanent) {
      // Delete from S3
      const deleteCommand = new DeleteObjectCommand({
        Bucket: Resource.PhotosBucket.name,
        Key: existing.s3_key,
      });
      await s3Client.send(deleteCommand);

      // Delete from database
      await permanentlyDeletePhoto(id);

      return c.json({
        success: true,
        message: 'Photo permanently deleted',
      });
    } else {
      // Soft delete
      await deletePhoto(id);

      return c.json({
        success: true,
        message: 'Photo deactivated',
      });
    }
  } catch (error) {
    console.error('Error deleting photo:', error);
    return c.json(
      {
        error: 'Failed to delete photo',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/photos/reorder - Reorder photos (requires editor role)
 */
app.post(
  '/reorder',
  requireEditor,
  zValidator('json', reorderSchema),
  async (c) => {
    try {
      const { photos } = c.req.valid('json');

      await reorderPhotos(photos);

      return c.json({
        success: true,
        message: 'Photos reordered successfully',
      });
    } catch (error) {
      console.error('Error reordering photos:', error);
      return c.json(
        {
          error: 'Failed to reorder photos',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

export default app;
