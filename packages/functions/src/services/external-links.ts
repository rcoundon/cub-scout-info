import { ExternalLinkEntity } from '../db/entities';
import type { ExternalLink, ExternalLinkParentType } from '../types/external-links';

/**
 * External Links Service using ElectroDB
 */

/**
 * Create a new external link
 */
export async function createExternalLink(
  linkData: Omit<ExternalLink, 'id' | 'created_at' | 'updated_at'>
) {
  const result = await ExternalLinkEntity.create(linkData).go();
  return result.data;
}

/**
 * Get an external link by ID
 */
export async function getExternalLink(id: string) {
  const result = await ExternalLinkEntity.get({ id }).go();
  return result.data || null;
}

/**
 * Update an external link
 */
export async function updateExternalLink(
  id: string,
  updates: Partial<Omit<ExternalLink, 'id' | 'created_at' | 'created_by'>>
) {
  // Fetch existing link to get composite key values for GSI index
  const existing = await getExternalLink(id);
  if (!existing) {
    return null;
  }

  const result = await ExternalLinkEntity.patch({ id })
    .set(updates)
    .composite({
      parent_type: existing.parent_type,
      parent_id: existing.parent_id,
    })
    .go({ response: 'all_new' });
  return result.data || null;
}

/**
 * Delete an external link
 */
export async function deleteExternalLink(id: string) {
  await ExternalLinkEntity.delete({ id }).go();
}

/**
 * Get external links by parent (event, announcement, or global)
 */
export async function getExternalLinksByParent(
  parentType: ExternalLinkParentType,
  parentId?: string
) {
  const result = await ExternalLinkEntity.query
    .byParent({
      parent_type: parentType,
      parent_id: parentId || 'none',
    })
    .go();

  // Sort by display_order (ascending)
  return result.data.sort((a, b) => a.display_order - b.display_order);
}

/**
 * Get all active global external links ordered by display_order
 */
export async function getActiveGlobalExternalLinks() {
  const result = await ExternalLinkEntity.query
    .byParent({
      parent_type: 'global',
      parent_id: 'none',
    })
    .go();

  // Filter to only active links and sort by display_order
  const activeLinks = result.data.filter((link: ExternalLink) => link.is_active);
  return activeLinks.sort((a, b) => a.display_order - b.display_order);
}

/**
 * Get all global external links (for admin) ordered by display_order
 */
export async function getAllGlobalExternalLinks() {
  const result = await ExternalLinkEntity.query
    .byParent({
      parent_type: 'global',
      parent_id: 'none',
    })
    .go();

  // Sort by display_order (ascending)
  return result.data.sort((a, b) => a.display_order - b.display_order);
}

/**
 * Get external links for a specific event (both active and inactive)
 */
export async function getEventExternalLinks(eventId: string) {
  const result = await ExternalLinkEntity.query
    .byParent({
      parent_type: 'event',
      parent_id: eventId,
    })
    .go();

  return result.data.sort((a, b) => a.display_order - b.display_order);
}

/**
 * Get external links for a specific announcement (both active and inactive)
 */
export async function getAnnouncementExternalLinks(announcementId: string) {
  const result = await ExternalLinkEntity.query
    .byParent({
      parent_type: 'announcement',
      parent_id: announcementId,
    })
    .go();

  return result.data.sort((a, b) => a.display_order - b.display_order);
}

/**
 * Reorder external links
 * Accepts an array of {id, display_order} objects and updates them
 */
export async function reorderExternalLinks(
  links: Array<{ id: string; display_order: number }>
) {
  const updatePromises = links.map((link) =>
    updateExternalLink(link.id, { display_order: link.display_order })
  );

  await Promise.all(updatePromises);
}
