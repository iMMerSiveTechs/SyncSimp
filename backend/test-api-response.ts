import { db } from './src/db.js';

async function testApiResponse() {
  const project = await db.project.findFirst({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  // This is what the API returns
  const apiResponse = {
    project: {
      id: project.id,
      userId: project.userId,
      name: project.name,
      bundleId: project.bundleId,
      platform: project.platform,
      appleIssuerId: project.appleIssuerId,
      appleKeyId: project.appleKeyId,
      appleP8FileContent: project.appleP8FileContent,
      revenueCatApiKey: project.revenueCatApiKey,
      revenueCatProjectId: project.revenueCatProjectId,
      revenueCatIosAppId: project.revenueCatIosAppId,
      configYaml: project.configYaml,
      syncStatus: project.syncStatus,
      lastCheckAt: project.lastCheckAt,
      lastSyncAt: project.lastSyncAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
  };

  console.log('\n=== API RESPONSE ===\n');
  console.log(JSON.stringify(apiResponse, null, 2));

  process.exit(0);
}

testApiResponse().catch(console.error);
