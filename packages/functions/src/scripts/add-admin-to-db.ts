import { createUser } from '../services/users';

(async () => {
  const userId = '36326274-4061-70b4-51b2-09a06f1857bc';

  try {
    await createUser(userId, {
      email: 'admin@cubscouts.test',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User',
    });

    console.log('✅ User created in DynamoDB successfully!');
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
})();
