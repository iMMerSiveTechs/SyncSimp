import { db } from './src/db.js';

async function forceUpdateKey() {
  const testKey = process.env.REVENUECAT_SECRET_KEY;
  if (!testKey) {
    console.error('ERROR: Set REVENUECAT_SECRET_KEY environment variable');
    process.exit(1);
  }

  console.log('Forcing database update...');

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
  console.log('RevenueCat API Key in DB:', project?.revenueCatApiKey ? '[SET]' : '[NOT SET]');
  console.log('Updated At:', project?.updatedAt);

  process.exit(0);
}

forceUpdateKey().catch(console.error);
