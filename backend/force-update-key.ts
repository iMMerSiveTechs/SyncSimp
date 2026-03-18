import { db } from './src/db.js';

async function forceUpdateKey() {
  // Use a dummy test key to see if the validation logic itself is the problem
  const testKey = 'sk_test_key_for_debugging';

  console.log('Forcing database update...');
  console.log('Setting RevenueCat API Key to:', testKey);

  await db.project.update({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' },
    data: {
      revenueCatApiKey: testKey,
      updatedAt: new Date()
    }
  });

  console.log('✅ Database updated!');

  // Verify
  const project = await db.project.findFirst({
    where: { name: 'SyncSimp' }
  });

  console.log('\nVerification:');
  console.log('RevenueCat API Key in DB:', project?.revenueCatApiKey);
  console.log('Updated At:', project?.updatedAt);

  process.exit(0);
}

forceUpdateKey().catch(console.error);
