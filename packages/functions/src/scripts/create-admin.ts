/**
 * Create an initial admin user for testing
 * Run with: pnpm sst shell tsx packages/functions/src/scripts/create-admin.ts
 */

import { createCognitoUser, setUserPassword } from '../services/cognito';
import { createUser, getUserByEmail } from '../services/users';

async function createAdminUser() {
  console.log('🔐 Creating admin user...\n');

  const adminEmail = 'admin@cubscouts.test';
  const adminPassword = 'TestPassword123!';

  try {
    // Check if user already exists in DynamoDB
    const existingUser = await getUserByEmail(adminEmail);
    if (existingUser) {
      console.log('✓ Admin user already exists in DynamoDB');
      console.log(`  Email: ${existingUser.email}`);
      console.log(`  Role: ${existingUser.role}`);
      console.log(`  ID: ${existingUser.id}\n`);
      console.log('✅ You can log in with:');
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}\n`);
      return;
    }

    // Create user in Cognito
    console.log('Creating user in Cognito...');
    const cognitoUser = await createCognitoUser(adminEmail, adminPassword);

    if (!cognitoUser || !cognitoUser.Username) {
      throw new Error('Failed to create Cognito user');
    }

    console.log(`✓ Created Cognito user: ${cognitoUser.Username}`);

    // Set permanent password
    console.log('Setting permanent password...');
    await setUserPassword(cognitoUser.Username, adminPassword, true);
    console.log('✓ Password set');

    // Create user in DynamoDB
    console.log('Creating user in DynamoDB...');
    const user = await createUser(cognitoUser.Username, {
      email: adminEmail,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
    });

    console.log('✓ Created DynamoDB user\n');
    console.log('✅ Admin user created successfully!\n');
    console.log('Login credentials:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  User ID: ${user.id}\n`);
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    if (error instanceof Error) {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

createAdminUser();
