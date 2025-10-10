import { UserEntity } from '../db/entities';
import type { User, UserRole } from '../types/users';

/**
 * Users Service using ElectroDB
 */

/**
 * Create a new user
 * Note: User ID comes from Cognito
 */
export async function createUser(
  userId: string,
  userData: Omit<User, 'id' | 'created_at' | 'updated_at'>
) {
  const result = await UserEntity.create({
    id: userId,
    ...userData,
  }).go();
  return result.data;
}

/**
 * Get a user by ID
 */
export async function getUser(userId: string) {
  const result = await UserEntity.get({ id: userId }).go();
  return result.data || null;
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string) {
  const result = await UserEntity.query.byEmail({ email: email.toLowerCase() }).go();
  return result.data[0] || null;
}

/**
 * Get all users
 */
export async function getAllUsers() {
  const result = await UserEntity.scan.go();
  return result.data;
}

/**
 * Update a user
 */
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'created_at' | 'email'>>
) {
  const result = await UserEntity.patch({ id: userId }).set(updates).go({ response: 'all_new' });
  return result.data || null;
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  await UserEntity.delete({ id: userId }).go();
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string) {
  await updateUser(userId, {
    last_login: new Date().toISOString(),
  });
}

/**
 * Update user role (admin only operation)
 */
export async function updateUserRole(userId: string, role: UserRole) {
  return updateUser(userId, { role });
}
