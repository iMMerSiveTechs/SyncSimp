import { db } from './src/db.js';

async function checkProject() {
  const project = await db.project.findFirst({
    where: { name: 'SyncSimp' }
  });

  if (!project) {
    console.log('No project found!');
    return;
  }

  console.log('\n=== PROJECT STATUS ===');
  console.log('Name:', project.name);
  console.log('Bundle ID:', project.bundleId);
  console.log('\n=== APPLE CREDENTIALS ===');
  console.log('Has Issuer ID:', !!project.appleIssuerId, project.appleIssuerId ? `(${project.appleIssuerId})` : '');
  console.log('Has Key ID:', !!project.appleKeyId, project.appleKeyId ? `(${project.appleKeyId})` : '');
  console.log('Has P8 File:', !!project.appleP8FileContent, project.appleP8FileContent ? `(${project.appleP8FileContent.length} chars)` : '');
  console.log('\n=== REVENUECAT CREDENTIALS ===');
  console.log('Has API Key:', !!project.revenueCatApiKey, project.revenueCatApiKey ? `(${project.revenueCatApiKey.substring(0, 15)}...)` : '');
  console.log('Project ID:', project.revenueCatProjectId || 'MISSING');
  console.log('iOS App ID:', project.revenueCatIosAppId || 'MISSING');
  console.log('\n=== CONFIG ===');
  console.log('Has Config YAML:', !!project.configYaml, project.configYaml ? `(${project.configYaml.length} chars)` : '');

  process.exit(0);
}

checkProject().catch(console.error);
