import { ContactMessageEntity } from '../db/entities';
import type { ContactMessage, ContactStatus } from '../types/contact';

/**
 * Create a new contact message
 */
export async function createContactMessage(
  messageData: Omit<ContactMessage, 'id' | 'created_at' | 'updated_at' | 'status'>
) {
  const result = await ContactMessageEntity.create({
    ...messageData,
    status: 'new',
  }).go();
  return result.data;
}

/**
 * Get a contact message by ID
 */
export async function getContactMessage(id: string) {
  const result = await ContactMessageEntity.get({ id }).go();
  return result.data || null;
}

/**
 * Get contact messages by status
 */
export async function getContactMessagesByStatus(status: ContactStatus) {
  const result = await ContactMessageEntity.query
    .byStatus({ status })
    .go({ order: 'desc' });
  return result.data;
}

/**
 * Get all contact messages
 */
export async function getAllContactMessages() {
  const [newMessages, read, replied, archived] = await Promise.all([
    getContactMessagesByStatus('new'),
    getContactMessagesByStatus('read'),
    getContactMessagesByStatus('replied'),
    getContactMessagesByStatus('archived'),
  ]);

  return [...newMessages, ...read, ...replied, ...archived];
}

/**
 * Update contact message status
 */
export async function updateContactMessageStatus(id: string, status: ContactStatus) {
  const existing = await getContactMessage(id);
  if (!existing) {
    return null;
  }

  const result = await ContactMessageEntity.patch({ id })
    .set({ status })
    .go({ response: 'all_new' });
  return result.data || null;
}

/**
 * Delete a contact message
 */
export async function deleteContactMessage(id: string) {
  await ContactMessageEntity.delete({ id }).go();
}
