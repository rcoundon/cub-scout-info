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
  parentType: 'event' | 'announcement',
  parentId: string,
  fileName: string,
  fileType: string,
  uploadedBy: string
): Promise<{ uploadUrl: string; attachmentId: string; s3Key: string }> {
  // Generate unique attachment ID
  const attachmentId = crypto.randomUUID();

  // Create S3 key with organized folder structure
  // Format: {parentType}s/{parentId}/attachments/{attachmentId}/{fileName}
  const s3Key = `${parentType}s/${parentId}/attachments/${attachmentId}/${fileName}`;

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

// Backwards compatibility wrapper for events
export async function generateUploadUrlForEvent(
  eventId: string,
  fileName: string,
  fileType: string,
  uploadedBy: string
) {
  return generateUploadUrl('event', eventId, fileName, fileType, uploadedBy);
}

/**
 * Create attachment metadata in DynamoDB after successful upload
 */
export async function createAttachment(
  parentType: 'event' | 'announcement',
  parentId: string,
  attachmentId: string,
  fileName: string,
  originalName: string,
  fileSize: number,
  contentType: string,
  s3Key: string,
  uploadedBy: string
) {
  const result = await AttachmentEntity.create({
    id: attachmentId,
    parent_type: parentType,
    parent_id: parentId,
    file_name: fileName,
    original_name: originalName,
    file_size: fileSize,
    content_type: contentType,
    s3_key: s3Key,
    uploaded_by: uploadedBy,
  }).go();

  return result.data;
}

/**
 * Get attachment by ID
 */
export async function getAttachment(
  parentType: 'event' | 'announcement',
  parentId: string,
  attachmentId: string
) {
  const result = await AttachmentEntity.get({
    parent_type: parentType,
    parent_id: parentId,
    id: attachmentId
  }).go();
  return result.data || null;
}

/**
 * List all attachments for a parent (event or announcement)
 */
export async function getAttachments(
  parentType: 'event' | 'announcement',
  parentId: string
) {
  const result = await AttachmentEntity.query.primary({
    parent_type: parentType,
    parent_id: parentId
  }).go();
  return result.data;
}

// Backwards compatibility wrapper for events
export async function getEventAttachments(eventId: string) {
  return getAttachments('event', eventId);
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
export async function deleteAttachment(
  parentType: 'event' | 'announcement',
  parentId: string,
  attachmentId: string
) {
  // First get the attachment to know the S3 key
  const attachment = await getAttachment(parentType, parentId, attachmentId);

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
    parent_type: parentType,
    parent_id: parentId,
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
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    return { valid: false, error: 'File type not allowed. Allowed types: PDF, Word (DOC/DOCX), Excel (XLS/XLSX), images (JPEG, PNG, GIF, WebP), TXT' };
  }

  return { valid: true };
}
