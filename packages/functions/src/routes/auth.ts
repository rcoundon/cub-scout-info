import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  authenticateUser,
  signOutUser,
  initiateForgotPassword,
  confirmForgotPassword,
  changeUserPassword,
  createCognitoUser,
  setUserPassword,
  refreshUserTokens,
  completeNewPasswordChallenge,
} from '../services/cognito';
import { createUser, getUser, getUserByEmail, getUserByInvitationToken, updateUser, updateLastLogin } from '../services/users';
import { isTokenExpired, isValidTokenFormat } from '../utils/invitation';
import { sendWelcomeEmail } from '../services/email';
import { requireAuth, requireAdmin, getUserContext } from '../middleware/auth';
import { extractToken } from '../utils/auth';

const app = new Hono();

/**
 * Login endpoint
 */
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();

    // Manual validation
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const { email, password } = schema.parse(body);

    // Authenticate with Cognito
    const tokens = await authenticateUser(email, password);

    // Update last login timestamp
    const user = await getUserByEmail(email);
    if (user) {
      await updateLastLogin(user.id);
    }

    return c.json({
      success: true,
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json(
      {
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Invalid credentials',
      },
      401
    );
  }
});

/**
 * Complete new password challenge endpoint
 * Used when a user logs in with a temporary password
 */
app.post(
  '/complete-new-password',
  zValidator(
    'json',
    z.object({
      username: z.string().email(),
      newPassword: z.string().min(8),
      session: z.string(),
    })
  ),
  async (c) => {
    try {
      const { username, newPassword, session } = c.req.valid('json');

      // Complete the password change challenge
      const tokens = await completeNewPasswordChallenge(username, newPassword, session);

      // Update last login timestamp
      const user = await getUserByEmail(username);
      if (user) {
        await updateLastLogin(user.id);
      }

      return c.json({
        success: true,
        ...tokens,
      });
    } catch (error) {
      console.error('Complete new password error:', error);
      return c.json(
        {
          error: 'Failed to set new password',
          message: error instanceof Error ? error.message : 'Password change failed',
        },
        400
      );
    }
  }
);

/**
 * Refresh token endpoint
 */
app.post(
  '/refresh',
  zValidator(
    'json',
    z.object({
      refreshToken: z.string(),
    })
  ),
  async (c) => {
    try {
      const { refreshToken } = c.req.valid('json');

      // Refresh tokens with Cognito
      const tokens = await refreshUserTokens(refreshToken);

      return c.json({
        success: true,
        ...tokens,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return c.json(
        {
          error: 'Token refresh failed',
          message: error instanceof Error ? error.message : 'Invalid refresh token',
        },
        401
      );
    }
  }
);

/**
 * Logout endpoint (requires authentication)
 */
app.post('/logout', requireAuth, async (c) => {
  try {
    const user = getUserContext(c);

    // Sign out from Cognito (invalidates all tokens)
    await signOutUser(user.email || user.userId);

    return c.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json(
      {
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Logout failed',
      },
      500
    );
  }
});

/**
 * Get current user info (requires authentication)
 */
app.get('/me', requireAuth, async (c) => {
  try {
    const userContext = getUserContext(c);
    const user = await getUser(userContext.userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      last_login: user.last_login,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json(
      {
        error: 'Failed to get user info',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * Register new user (admin only)
 */
app.post(
  '/register',
  requireAdmin,
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
      first_name: z.string().min(1),
      last_name: z.string().min(1),
      role: z.enum(['admin', 'editor', 'viewer']),
      password: z.string().min(8),
    })
  ),
  async (c) => {
    try {
      const { email, first_name, last_name, role, password } = c.req.valid('json');

      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return c.json({ error: 'User already exists' }, 400);
      }

      // Create user in Cognito
      const cognitoUserId = await createCognitoUser(email, password);

      if (!cognitoUserId) {
        throw new Error('Failed to create Cognito user');
      }

      // Set permanent password
      await setUserPassword(cognitoUserId, password, true);

      // Create user in DynamoDB
      const user = await createUser(cognitoUserId, {
        email,
        first_name,
        last_name,
        role,
      });

      return c.json(
        {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
          },
        },
        201
      );
    } catch (error) {
      console.error('Registration error:', error);
      return c.json(
        {
          error: 'Registration failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * Validate invitation endpoint
 * Checks if invitation is valid and returns user info
 */
app.get('/validate-invite', async (c) => {
  try {
    const token = c.req.query('token');

    if (!token) {
      return c.json(
        {
          error: 'Missing token',
          message: 'Invitation token is required',
        },
        400
      );
    }

    // Validate token format
    if (!isValidTokenFormat(token)) {
      return c.json(
        {
          error: 'Invalid invitation',
          message: 'The invitation link is invalid',
        },
        400
      );
    }

    // Find user by invitation token
    const invitedUser = await getUserByInvitationToken(token);

    if (!invitedUser) {
      return c.json(
        {
          error: 'Invalid invitation',
          message: 'The invitation link is invalid or has already been used',
        },
        400
      );
    }

    // Check if invitation has expired
    if (invitedUser.invitation_token_expires && isTokenExpired(invitedUser.invitation_token_expires)) {
      return c.json(
        {
          error: 'Invitation expired',
          message: 'This invitation has expired',
        },
        400
      );
    }

    // Check if user is already active
    if (invitedUser.invitation_status === 'active') {
      return c.json(
        {
          error: 'Invitation already used',
          message: 'This invitation has already been accepted',
        },
        400
      );
    }

    // Return user info (without sensitive data)
    return c.json({
      email: invitedUser.email,
      first_name: invitedUser.first_name,
      last_name: invitedUser.last_name,
      role: invitedUser.role,
    });
  } catch (error) {
    console.error('Validate invitation error:', error);
    return c.json(
      {
        error: 'Failed to validate invitation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * Accept invitation endpoint
 * Validates invitation token and creates user account with chosen password
 */
app.post(
  '/accept-invite',
  zValidator(
    'json',
    z.object({
      token: z.string(),
      password: z.string().min(8),
    })
  ),
  async (c) => {
    try {
      const { token, password } = c.req.valid('json');

      // Validate token format
      if (!isValidTokenFormat(token)) {
        return c.json(
          {
            error: 'Invalid invitation',
            message: 'The invitation link is invalid',
          },
          400
        );
      }

      // Find user by invitation token
      const invitedUser = await getUserByInvitationToken(token);

      if (!invitedUser) {
        return c.json(
          {
            error: 'Invalid invitation',
            message: 'The invitation link is invalid or has already been used',
          },
          400
        );
      }

      // Check if invitation has expired
      if (invitedUser.invitation_token_expires && isTokenExpired(invitedUser.invitation_token_expires)) {
        return c.json(
          {
            error: 'Invitation expired',
            message: 'This invitation has expired. Please request a new invitation from your administrator',
          },
          400
        );
      }

      // Check if user is already active
      if (invitedUser.invitation_status === 'active') {
        return c.json(
          {
            error: 'Invitation already used',
            message: 'This invitation has already been accepted. Please log in instead',
          },
          400
        );
      }

      // Create user in Cognito
      let cognitoUserId: string;
      try {
        cognitoUserId = await createCognitoUser(invitedUser.email, password);

        if (!cognitoUserId) {
          throw new Error('Failed to create Cognito user');
        }

        // Set permanent password
        await setUserPassword(cognitoUserId, password, true);
      } catch (cognitoError) {
        console.error('Error creating Cognito user:', cognitoError);
        return c.json(
          {
            error: 'Failed to activate account',
            message: cognitoError instanceof Error ? cognitoError.message : 'Unknown error',
          },
          500
        );
      }

      // Update user in DynamoDB - replace temporary ID with Cognito ID
      try {
        // Update the user record
        await updateUser(invitedUser.id, {
          invitation_status: 'active',
          invitation_token: undefined as any, // Clear the token
          invitation_token_expires: undefined as any,
        });

        // Also need to create a new user record with the Cognito ID
        // and delete the old temporary one
        const updatedUser = await createUser(cognitoUserId, {
          email: invitedUser.email,
          first_name: invitedUser.first_name,
          last_name: invitedUser.last_name,
          role: invitedUser.role,
          invitation_status: 'active',
          invited_at: invitedUser.invited_at,
        });

        // Delete the temporary user record
        // (We'll implement this after fixing the current flow)

        // Send welcome email
        try {
          await sendWelcomeEmail(updatedUser.email, updatedUser.first_name);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail the request if email fails
        }

        // Automatically log the user in
        const tokens = await authenticateUser(updatedUser.email, password);

        return c.json({
          success: true,
          message: 'Account activated successfully',
          ...tokens,
        });
      } catch (error) {
        console.error('Error activating user account:', error);
        // Try to clean up Cognito user if DynamoDB update fails
        try {
          await setUserPassword(cognitoUserId, password, false); // Revert to temporary
        } catch (cleanupError) {
          console.error('Error cleaning up after failed activation:', cleanupError);
        }

        return c.json(
          {
            error: 'Failed to activate account',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          500
        );
      }
    } catch (error) {
      console.error('Accept invitation error:', error);
      return c.json(
        {
          error: 'Failed to accept invitation',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * Forgot password - initiate reset
 */
app.post(
  '/forgot-password',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
    })
  ),
  async (c) => {
    try {
      const { email } = c.req.valid('json');

      // Check if user exists in our database
      const user = await getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return c.json({
          success: true,
          message: 'If the email exists, a password reset code has been sent',
        });
      }

      // Initiate forgot password flow
      await initiateForgotPassword(email);

      return c.json({
        success: true,
        message: 'Password reset code sent to email',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return c.json(
        {
          error: 'Failed to initiate password reset',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);

/**
 * Confirm forgot password with verification code
 */
app.post(
  '/confirm-forgot-password',
  zValidator(
    'json',
    z.object({
      email: z.string().email(),
      verification_code: z.string(),
      new_password: z.string().min(8),
    })
  ),
  async (c) => {
    try {
      const { email, verification_code, new_password } = c.req.valid('json');

      await confirmForgotPassword(email, verification_code, new_password);

      return c.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Confirm password reset error:', error);
      return c.json(
        {
          error: 'Failed to reset password',
          message: error instanceof Error ? error.message : 'Invalid or expired code',
        },
        400
      );
    }
  }
);

/**
 * Change password (requires authentication)
 */
app.post(
  '/change-password',
  requireAuth,
  zValidator(
    'json',
    z.object({
      current_password: z.string(),
      new_password: z.string().min(8),
    })
  ),
  async (c) => {
    try {
      const { current_password, new_password } = c.req.valid('json');

      // Get access token from header
      const authHeader = c.req.header('Authorization');
      const token = extractToken(authHeader);

      if (!token) {
        return c.json({ error: 'Missing access token' }, 401);
      }

      await changeUserPassword(token, current_password, new_password);

      return c.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      return c.json(
        {
          error: 'Failed to change password',
          message: error instanceof Error ? error.message : 'Invalid current password',
        },
        400
      );
    }
  }
);

export default app;
