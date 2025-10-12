#!/usr/bin/env tsx

import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { Resource } from 'sst'
import { createUser, getUserByEmail } from '../services/users'

// Test users matching frontend/tests/e2e/fixtures/auth.ts
const TEST_USERS = [
  {
    email: 'admin@test.com',
    password: 'Admin123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin' as const,
  },
  {
    email: 'editor@test.com',
    password: 'Editor123!',
    firstName: 'Test',
    lastName: 'Editor',
    role: 'editor' as const,
  },
  {
    email: 'viewer@test.com',
    password: 'Viewer123!',
    firstName: 'Test',
    lastName: 'Viewer',
    role: 'viewer' as const,
  },
]

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'eu-west-2',
})

async function setupTestUser(user: typeof TEST_USERS[0]) {
  const userPoolId = Resource.CubsSiteAuth.id

  console.log(`Setting up test user: ${user.email} (${user.role})`)

  try {
    // Check if user already exists in Cognito
    let cognitoUserId: string | undefined

    try {
      const getUserResult = await cognitoClient.send(
        new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: user.email,
        })
      )

      // User exists in Cognito, get their sub (user ID)
      cognitoUserId = getUserResult.UserAttributes?.find((attr) => attr.Name === 'sub')?.Value

      console.log(`  ✓ User already exists in Cognito (${cognitoUserId})`)

      // Update password to ensure it matches
      await cognitoClient.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: user.email,
          Password: user.password,
          Permanent: true,
        })
      )

      console.log('  ✓ Password updated')
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        // User doesn't exist, create them
        const createResult = await cognitoClient.send(
          new AdminCreateUserCommand({
            UserPoolId: userPoolId,
            Username: user.email,
            UserAttributes: [
              { Name: 'email', Value: user.email },
              { Name: 'email_verified', Value: 'true' },
              { Name: 'given_name', Value: user.firstName },
              { Name: 'family_name', Value: user.lastName },
            ],
            MessageAction: 'SUPPRESS', // Don't send welcome email
          })
        )

        // Get the user's sub (Cognito user ID)
        cognitoUserId = createResult.User?.Attributes?.find((attr) => attr.Name === 'sub')?.Value

        console.log(`  ✓ Created in Cognito (${cognitoUserId})`)

        // Set permanent password
        await cognitoClient.send(
          new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: user.email,
            Password: user.password,
            Permanent: true,
          })
        )

        console.log('  ✓ Password set')
      } else {
        throw error
      }
    }

    if (!cognitoUserId) {
      throw new Error('Failed to get Cognito user ID')
    }

    // Check if user exists in our database
    const existingUser = await getUserByEmail(user.email)

    if (existingUser) {
      console.log('  ✓ User already exists in database')
    } else {
      // Create user in our database
      await createUser(cognitoUserId, {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
      })

      console.log('  ✓ Created in database')
    }

    console.log(`✓ ${user.email} setup complete\n`)
  } catch (error) {
    console.error(`✗ Failed to setup ${user.email}:`, error)
    throw error
  }
}

async function cleanupTestUsers() {
  const userPoolId = Resource.CubsSiteAuth.id

  console.log('Cleaning up existing test users...\n')

  for (const user of TEST_USERS) {
    try {
      await cognitoClient.send(
        new AdminDeleteUserCommand({
          UserPoolId: userPoolId,
          Username: user.email,
        })
      )
      console.log(`  ✓ Deleted ${user.email} from Cognito`)
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        // User doesn't exist, skip
      } else {
        console.error(`  ✗ Failed to delete ${user.email}:`, error.message)
      }
    }
  }

  console.log('\nCleanup complete\n')
}

async function main() {
  const args = process.argv.slice(2)
  const shouldCleanup = args.includes('--cleanup')

  console.log('==========================================')
  console.log('E2E Test Users Setup')
  console.log('==========================================\n')

  if (shouldCleanup) {
    await cleanupTestUsers()
  }

  console.log('Setting up test users...\n')

  for (const user of TEST_USERS) {
    await setupTestUser(user)
  }

  console.log('==========================================')
  console.log('All test users setup complete!')
  console.log('==========================================\n')

  console.log('Test users:')
  for (const user of TEST_USERS) {
    console.log(`  ${user.role.padEnd(8)} - ${user.email} / ${user.password}`)
  }
}

// Run the script
main().catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
})
