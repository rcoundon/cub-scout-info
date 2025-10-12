import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getAllUsers,
  getUser,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
} from '../services/users';
import { deleteUserFromCognito } from '../services/cognito';
import { requireAdmin, getUserContext } from '../middleware/auth';
import {
  generateInvitationToken,
  calculateTokenExpiration,
  generateTemporaryUserId
} from '../utils/invitation';
import { sendInvitationEmail } from '../services/email';

const app = new Hono();

// All routes in this file require admin role

/**
 * GET /api/admin/users - List all users
 * Returns all users with their details
 */
app.get('/', requireAdmin, async (c) => {
  try {
    const users = await getAllUsers();

    // Don't send sensitive data
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      created_at: user.created_at,
      last_login: user.last_login,
    }));

    return c.json({ users: sanitizedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

/**
 * POST /api/admin/users - Invite new user
 * Creates user invitation and sends invitation email
 */
app.post(
  '/',
  requireAdmin,
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
      first_name: z.string().min(1),
      last_name: z.string().min(1),
      role: z.enum(['admin', 'editor', 'viewer']),
    })
  ),
  async (c) => {
    try {
      const userData = c.req.valid('json');
      const currentUser = getUserContext(c);

      // Check if user already exists
      const existingUser = await getUserByEmail(userData.email);
      if (existingUser) {
        return c.json(
          {
            error: 'User already exists',
            message: 'A user with this email already exists',
          },
          400
        );
      }

      // Generate invitation token and expiration
      const invitationToken = generateInvitationToken();
      const tokenExpires = calculateTokenExpiration(72); // 72 hours
      const temporaryUserId = generateTemporaryUserId();

      // Create user in DynamoDB with invitation status
      try {
        const newUser = await createUser(temporaryUserId, {
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          invitation_token: invitationToken,
          invitation_token_expires: tokenExpires,
          invitation_status: 'invited',
          invited_at: new Date().toISOString(),
        });

        // Send invitation email
        try {
          // Get inviter's name
          const inviter = await getUser(currentUser.userId);
          const inviterName = inviter
            ? `${inviter.first_name} ${inviter.last_name}`
            : 'An administrator';

          await sendInvitationEmail({
            toEmail: userData.email,
            toName: `${userData.first_name} ${userData.last_name}`,
            invitedBy: inviterName,
            token: invitationToken,
            role: userData.role,
          });
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError);
          // Don't fail the request if email fails - admin can resend
        }

        return c.json(
          {
            success: true,
            user: {
              id: newUser.id,
              email: newUser.email,
              role: newUser.role,
              first_name: newUser.first_name,
              last_name: newUser.last_name,
              invitation_status: newUser.invitation_status,
              invited_at: newUser.invited_at,
              created_at: newUser.created_at,
            },
            message: 'Invitation sent successfully',
          },
          201
        );
      } catch (dbError) {
        console.error('Error creating user invitation:', dbError);
        return c.json(
          {
            error: 'Failed to create invitation',
            message: dbError instanceof Error ? dbError.message : 'Unknown error',
          },
          500
        );
      }
    } catch (error) {
      console.error('Error creating user invitation:', error);
      return c.json(
        {
          error: 'Failed to create invitation',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * GET /api/admin/users/:id - Get single user by ID
 */
app.get('/:id', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id');
    const user = await getUser(userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Don't send sensitive data
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
    };

    return c.json({ user: sanitizedUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

/**
 * PUT /api/admin/users/:id - Update user
 * Admin can update user details and role
 */
app.put(
  '/:id',
  requireAdmin,
  zValidator(
    'json',
    z.object({
      first_name: z.string().min(1).optional(),
      last_name: z.string().min(1).optional(),
      role: z.enum(['admin', 'editor', 'viewer']).optional(),
    })
  ),
  async (c) => {
    try {
      const userId = c.req.param('id');
      const updates = c.req.valid('json');
      const currentUser = getUserContext(c);

      // Check if user exists
      const existingUser = await getUser(userId);
      if (!existingUser) {
        return c.json({ error: 'User not found' }, 404);
      }

      // Prevent admin from demoting themselves
      if (userId === currentUser.userId && updates.role && updates.role !== 'admin') {
        return c.json(
          {
            error: 'Cannot change your own role',
            message: 'You cannot demote yourself from admin'
          },
          403
        );
      }

      // Update user
      const updatedUser = await updateUser(userId, updates);

      if (!updatedUser) {
        return c.json({ error: 'Failed to update user' }, 500);
      }

      return c.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          updated_at: updatedUser.updated_at,
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return c.json(
        {
          error: 'Failed to update user',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * DELETE /api/admin/users/:id - Delete user
 * Removes user from both Cognito and DynamoDB
 */
app.delete('/:id', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id');
    const currentUser = getUserContext(c);

    // Check if user exists
    const existingUser = await getUser(userId);
    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Prevent admin from deleting themselves
    if (userId === currentUser.userId) {
      return c.json(
        {
          error: 'Cannot delete yourself',
          message: 'You cannot delete your own account',
        },
        403
      );
    }

    // Delete from Cognito first
    try {
      await deleteUserFromCognito(userId);
    } catch (cognitoError) {
      console.error('Error deleting from Cognito:', cognitoError);
      // Continue anyway - user might not exist in Cognito
    }

    // Delete from DynamoDB
    await deleteUser(userId);

    return c.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json(
      {
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default app;
