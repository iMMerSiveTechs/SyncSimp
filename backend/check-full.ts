import { db } from './src/db.js';

async function checkFullProject() {
  const project = await db.project.findFirst({
    where: { name: 'SyncSimp' }
  });

  if (!project) {
    console.log('No project found');
    return;
  }

  console.log('\n=== FULL PROJECT DATA ===\n');
  console.log('RevenueCat API Key:', project.revenueCatApiKey);
  console.log('Apple Issuer ID:', project.appleIssuerId);
  console.log('Apple Key ID:', project.appleKeyId);
  console.log('Apple P8 length:', project.appleP8FileContent?.length);
  console.log('\nUpdated At:', project.updatedAt);

  process.exit(0);
}

checkFullProject().catch(console.error);
