/**
 * Photo entity types
 */

export interface Photo {
  id: string;
  url: string; // CloudFront URL for the photo
  s3_key: string; // S3 object key
  caption: string;
  display_order: number; // For sorting photos in the gallery
  is_active: boolean; // For hiding/showing photos
  file_size: number; // File size in bytes
  content_type: string; // MIME type (e.g., 'image/jpeg')
  uploaded_by: string; // Cognito user ID
  created_at: string; // ISO 8601 timestamp
  updated_at?: string; // ISO 8601 timestamp
}

export interface CreatePhotoInput {
  s3_key: string;
  caption: string;
  file_size: number;
  content_type: string;
  display_order?: number;
}
