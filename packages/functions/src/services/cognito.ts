import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  AdminUserGlobalSignOutCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ChangePasswordCommand,
  type AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { Resource } from 'sst';

/**
 * Cognito Service
 * Handles user authentication and management via AWS Cognito
 */

const client = new CognitoIdentityProviderClient({});

/**
 * Admin creates a new user in Cognito
 * User will receive a temporary password via email
 */
export async function createCognitoUser(email: string, temporaryPassword: string) {
  const command = new AdminCreateUserCommand({
    UserPoolId: Resource.CubsSiteAuth.id,
    Username: email,
    UserAttributes: [
      {
        Name: 'email',
        Value: email,
      },
      {
        Name: 'email_verified',
        Value: 'true',
      },
    ],
    TemporaryPassword: temporaryPassword,
    MessageAction: 'SUPPRESS', // Don't send email - we'll handle it ourselves
  });

  const response = await client.send(command);
  return response.User;
}

/**
 * Set a permanent password for a user (used after initial creation)
 */
export async function setUserPassword(username: string, password: string, permanent = true) {
  const command = new AdminSetUserPasswordCommand({
    UserPoolId: Resource.CubsSiteAuth.id,
    Username: username,
    Password: password,
    Permanent: permanent,
  });

  await client.send(command);
}

/**
 * Authenticate a user with username and password
 * Returns JWT tokens on success
 */
export async function authenticateUser(email: string, password: string) {
  const command = new AdminInitiateAuthCommand({
    UserPoolId: Resource.CubsSiteAuth.id,
    ClientId: process.env.USER_POOL_CLIENT_ID || '',
    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH' as AuthFlowType,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const response = await client.send(command);

  if (!response.AuthenticationResult) {
    throw new Error('Authentication failed: No tokens returned');
  }

  return {
    accessToken: response.AuthenticationResult.AccessToken,
    idToken: response.AuthenticationResult.IdToken,
    refreshToken: response.AuthenticationResult.RefreshToken,
    expiresIn: response.AuthenticationResult.ExpiresIn,
  };
}

/**
 * Sign out a user globally (invalidates all tokens)
 */
export async function signOutUser(username: string) {
  const command = new AdminUserGlobalSignOutCommand({
    UserPoolId: Resource.CubsSiteAuth.id,
    Username: username,
  });

  await client.send(command);
}

/**
 * Get user details from Cognito
 */
export async function getCognitoUser(username: string) {
  const command = new AdminGetUserCommand({
    UserPoolId: Resource.CubsSiteAuth.id,
    Username: username,
  });

  const response = await client.send(command);
  return response;
}

/**
 * Update user attributes in Cognito
 */
export async function updateUserAttributes(
  username: string,
  attributes: Record<string, string>
) {
  const command = new AdminUpdateUserAttributesCommand({
    UserPoolId: Resource.CubsSiteAuth.id,
    Username: username,
    UserAttributes: Object.entries(attributes).map(([name, value]) => ({
      Name: name,
      Value: value,
    })),
  });

  await client.send(command);
}

/**
 * Initiate forgot password flow
 * Sends a verification code to the user's email
 */
export async function initiateForgotPassword(email: string) {
  const command = new ForgotPasswordCommand({
    ClientId: process.env.USER_POOL_CLIENT_ID || '',
    Username: email,
  });

  const response = await client.send(command);
  return response.CodeDeliveryDetails;
}

/**
 * Confirm forgot password with verification code
 */
export async function confirmForgotPassword(
  email: string,
  verificationCode: string,
  newPassword: string
) {
  const command = new ConfirmForgotPasswordCommand({
    ClientId: process.env.USER_POOL_CLIENT_ID || '',
    Username: email,
    ConfirmationCode: verificationCode,
    Password: newPassword,
  });

  await client.send(command);
}

/**
 * Change password for authenticated user
 */
export async function changeUserPassword(
  accessToken: string,
  previousPassword: string,
  proposedPassword: string
) {
  const command = new ChangePasswordCommand({
    AccessToken: accessToken,
    PreviousPassword: previousPassword,
    ProposedPassword: proposedPassword,
  });

  await client.send(command);
}

/**
 * Delete a user from Cognito (admin only)
 */
export async function deleteUserFromCognito(username: string) {
  const command = new AdminDeleteUserCommand({
    UserPoolId: Resource.CubsSiteAuth.id,
    Username: username,
  });

  await client.send(command);
}
