import { AnnouncementEntity } from '../db/entities';
import type { Announcement, AnnouncementStatus } from '../types/announcements';
import { getUser } from './users';

/**
 * Announcements Service using ElectroDB
 */

/**
 * Enrich announcement with creator information
 */
async function enrichAnnouncementWithCreator(announcement: Announcement) {
  try {
    const creator = await getUser(announcement.created_by);
    if (!creator) {
      return {
        ...announcement,
        creator_name: 'Unknown',
      };
    }

    // Format: "Leadership Name (First Last)" or just "First Last" if no leadership name
    const fullName = `${creator.first_name} ${creator.last_name}`;
    const creator_name = creator.leadership_name
      ? `${creator.leadership_name} (${fullName})`
      : fullName;

    return {
      ...announcement,
      creator_name,
    };
  } catch (error) {
    console.error('Failed to fetch creator:', error);
    return {
      ...announcement,
      creator_name: 'Unknown',
    };
  }
}

/**
 * Enrich multiple announcements with creator information
 */
async function enrichAnnouncementsWithCreators(announcements: Announcement[]) {
  return Promise.all(announcements.map(enrichAnnouncementWithCreator));
}

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
  if (!result.data) return null;

  return enrichAnnouncementWithCreator(result.data);
}

/**
 * Update an announcement
 */
export async function updateAnnouncement(
  id: string,
  updates: Partial<Omit<Announcement, 'id' | 'created_at' | 'created_by'>>
) {
  // If updating priority or status, we need to provide created_at for GSI key formatting
  if (updates.priority !== undefined || updates.status !== undefined) {
    const existing = await getAnnouncement(id);
    if (!existing) {
      return null;
    }

    const result = await AnnouncementEntity.patch({ id })
      .set(updates)
      .composite({ created_at: existing.created_at })
      .go({ response: 'all_new' });
    return result.data || null;
  }

  // For other updates, no composite needed
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
    .go();

  const now = new Date().toISOString();

  // Filter out expired announcements
  const active = result.data.filter((announcement: Announcement) => {
    return !announcement.expires_at || announcement.expires_at > now;
  });

  // Sort by priority (high > medium > low) then by date (newest first)
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sorted = active.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.created_at.localeCompare(a.created_at);
  });

  return enrichAnnouncementsWithCreators(sorted);
}

/**
 * Get announcements by status
 */
export async function getAnnouncementsByStatus(status: AnnouncementStatus) {
  const result = await AnnouncementEntity.query
    .byStatus({ status })
    .go();

  // Sort by priority (high > medium > low) then by date (newest first)
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sorted = result.data.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.created_at.localeCompare(a.created_at);
  });

  return enrichAnnouncementsWithCreators(sorted);
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
