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
} from '../services/cognito';
import { createUser, getUser, getUserByEmail, updateLastLogin } from '../services/users';
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
      const cognitoUser = await createCognitoUser(email, password);

      if (!cognitoUser || !cognitoUser.Username) {
        throw new Error('Failed to create Cognito user');
      }

      // Set permanent password
      await setUserPassword(cognitoUser.Username, password, true);

      // Create user in DynamoDB
      const user = await createUser(cognitoUser.Username, {
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
