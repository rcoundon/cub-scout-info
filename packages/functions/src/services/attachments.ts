import { AttachmentEntity } from '../db/entities';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Resource } from 'sst';

/**
 * Attachments Service
 * Handles file uploads to S3 and metadata in DynamoDB
 */

const s3Client = new S3Client({});

/**
 * Generate a presigned URL for uploading a file to S3
 */
export async function generateUploadUrl(
  eventId: string,
  fileName: string,
  fileType: string,
  uploadedBy: string
): Promise<{ uploadUrl: string; attachmentId: string; s3Key: string }> {
  // Generate unique attachment ID
  const attachmentId = crypto.randomUUID();

  // Create S3 key with organized folder structure
  // Format: events/{eventId}/attachments/{attachmentId}/{fileName}
  const s3Key = `events/${eventId}/attachments/${attachmentId}/${fileName}`;

  // Create presigned URL for upload (expires in 5 minutes)
  const command = new PutObjectCommand({
    Bucket: Resource.CubsSiteUploads.name,
    Key: s3Key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return {
    uploadUrl,
    attachmentId,
    s3Key,
  };
}

/**
 * Create attachment metadata in DynamoDB after successful upload
 */
export async function createAttachment(
  eventId: string,
  attachmentId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  s3Key: string,
  uploadedBy: string
) {
  const result = await AttachmentEntity.create({
    id: attachmentId,
    event_id: eventId,
    file_name: fileName,
    file_size: fileSize,
    file_type: fileType,
    s3_key: s3Key,
    uploaded_by: uploadedBy,
  }).go();

  return result.data;
}

/**
 * Get attachment by ID
 */
export async function getAttachment(eventId: string, attachmentId: string) {
  const result = await AttachmentEntity.get({
    event_id: eventId,
    id: attachmentId
  }).go();
  return result.data || null;
}

/**
 * List all attachments for an event
 */
export async function getEventAttachments(eventId: string) {
  const result = await AttachmentEntity.query.primary({ event_id: eventId }).go();
  return result.data;
}

/**
 * Generate presigned URL for downloading a file from S3
 */
export async function generateDownloadUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: Resource.CubsSiteUploads.name,
    Key: s3Key,
  });

  // URL expires in 1 hour
  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return downloadUrl;
}

/**
 * Delete attachment (removes from both S3 and DynamoDB)
 */
export async function deleteAttachment(eventId: string, attachmentId: string) {
  // First get the attachment to know the S3 key
  const attachment = await getAttachment(eventId, attachmentId);

  if (!attachment) {
    return false;
  }

  // Delete from S3
  const deleteCommand = new DeleteObjectCommand({
    Bucket: Resource.CubsSiteUploads.name,
    Key: attachment.s3_key,
  });

  await s3Client.send(deleteCommand);

  // Delete from DynamoDB
  await AttachmentEntity.delete({
    event_id: eventId,
    id: attachmentId
  }).go();

  return true;
}

/**
 * Validate file type and size
 */
export function validateFile(fileName: string, fileSize: number, fileType: string) {
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
  ];

  if (fileSize > maxFileSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  if (!allowedTypes.includes(fileType)) {
    return { valid: false, error: 'File type not allowed. Allowed types: PDF, DOC, DOCX, images (JPEG, PNG, GIF, WebP), TXT' };
  }

  return { valid: true };
}
