import { AnnouncementEntity } from '../db/entities';
import type { Announcement, AnnouncementStatus } from '../types/announcements';

/**
 * Announcements Service using ElectroDB
 */

/**
 * Create a new announcement
 */
export async function createAnnouncement(
  announcementData: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>
) {
  const result = await AnnouncementEntity.create(announcementData).go();
  return result.data;
}

/**
 * Get an announcement by ID
 */
export async function getAnnouncement(id: string) {
  const result = await AnnouncementEntity.get({ id }).go();
  return result.data || null;
}

/**
 * Update an announcement
 */
export async function updateAnnouncement(
  id: string,
  updates: Partial<Omit<Announcement, 'id' | 'created_at' | 'created_by'>>
) {
  const result = await AnnouncementEntity.patch({ id })
    .set(updates)
    .go({ response: 'all_new' });
  return result.data || null;
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(id: string) {
  await AnnouncementEntity.delete({ id }).go();
}

/**
 * Get published announcements ordered by priority (highest first) then by date
 */
export async function getPublishedAnnouncements() {
  const result = await AnnouncementEntity.query
    .byStatus({ status: 'published' })
    .go({ order: 'desc' }); // Descending order for priority

  const now = new Date().toISOString();

  // Filter out expired announcements
  return result.data.filter((announcement: Announcement) => {
    return !announcement.expires_at || announcement.expires_at > now;
  });
}

/**
 * Get announcements by status
 */
export async function getAnnouncementsByStatus(status: AnnouncementStatus) {
  const result = await AnnouncementEntity.query
    .byStatus({ status })
    .go({ order: 'desc' });
  return result.data;
}

/**
 * Auto-expire announcements that have passed their expiry date
 */
export async function expireAnnouncements() {
  const now = new Date().toISOString();
  const published = await getAnnouncementsByStatus('published');

  let expiredCount = 0;

  for (const announcement of published) {
    if (announcement.expires_at && announcement.expires_at <= now) {
      await updateAnnouncement(announcement.id, { status: 'expired' });
      expiredCount++;
    }
  }

  return expiredCount;
}
