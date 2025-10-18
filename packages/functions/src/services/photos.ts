import { PhotoEntity } from '../db/entities';
import type { Photo, CreatePhotoInput } from '../types/photos';
import { Resource } from 'sst';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({});

/**
 * Photos Service using ElectroDB
 */

/**
 * Generate presigned URL for a photo
 */
export async function generatePhotoUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: Resource.PhotosBucket.name,
    Key: s3Key,
  });

  // URL expires in 1 hour
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

/**
 * Create a new photo record
 */
export async function createPhoto(
  photoData: CreatePhotoInput & { uploaded_by: string }
) {
  const result = await PhotoEntity.create({
    ...photoData,
    url: '', // Empty string, will be generated on fetch
    is_active: true,
    display_order: photoData.display_order ?? 0,
  }).go();

  return result.data;
}

/**
 * Get a photo by ID with presigned URL
 */
export async function getPhoto(id: string) {
  const result = await PhotoEntity.get({ id }).go();
  if (!result.data) return null;

  // Generate presigned URL
  const url = await generatePhotoUrl(result.data.s3_key);

  return {
    ...result.data,
    url,
  };
}

/**
 * Update a photo with presigned URL
 */
export async function updatePhoto(
  id: string,
  updates: Partial<Omit<Photo, 'id' | 'created_at' | 'uploaded_by' | 's3_key' | 'url'>>
) {
  const result = await PhotoEntity.patch({ id })
    .set(updates)
    .go({ response: 'all_new' });

  if (!result.data) return null;

  // Generate presigned URL
  const url = await generatePhotoUrl(result.data.s3_key);

  return {
    ...result.data,
    url,
  };
}

/**
 * Delete a photo (soft delete by setting is_active to false)
 */
export async function deletePhoto(id: string) {
  await PhotoEntity.patch({ id })
    .set({ is_active: false })
    .go();
}

/**
 * Permanently delete a photo record
 */
export async function permanentlyDeletePhoto(id: string) {
  await PhotoEntity.delete({ id }).go();
}

/**
 * Get all active photos ordered by display_order with presigned URLs
 */
export async function getActivePhotos() {
  const result = await PhotoEntity.query
    .byStatus({
      is_active: true,
    })
    .go();

  // Generate presigned URLs for all photos
  const photosWithUrls = await Promise.all(
    result.data.map(async (photo) => ({
      ...photo,
      url: await generatePhotoUrl(photo.s3_key),
    }))
  );

  return photosWithUrls;
}

/**
 * Get all photos (for admin) ordered by display_order with presigned URLs
 */
export async function getAllPhotos() {
  // Since we need all photos regardless of status, we'll query both
  const [activePhotos, inactivePhotos] = await Promise.all([
    PhotoEntity.query.byStatus({ is_active: true }).go(),
    PhotoEntity.query.byStatus({ is_active: false }).go(),
  ]);

  // Combine and sort by display_order
  const allPhotos = [...activePhotos.data, ...inactivePhotos.data];
  const sortedPhotos = allPhotos.sort((a, b) => a.display_order - b.display_order);

  // Generate presigned URLs for all photos
  const photosWithUrls = await Promise.all(
    sortedPhotos.map(async (photo) => ({
      ...photo,
      url: await generatePhotoUrl(photo.s3_key),
    }))
  );

  return photosWithUrls;
}

/**
 * Reorder photos
 * Accepts an array of {id, display_order} objects and updates them
 */
export async function reorderPhotos(
  photos: Array<{ id: string; display_order: number }>
) {
  const updatePromises = photos.map((photo) =>
    updatePhoto(photo.id, { display_order: photo.display_order })
  );

  await Promise.all(updatePromises);
}
