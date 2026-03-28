import { PrismaClient } from './generated/prisma/index.js';

const freshDb = new PrismaClient();

const project = await freshDb.project.findUnique({
  where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
});

console.log('\n=== ACTUAL DATABASE STATE ===\n');
console.log('RevenueCat API Key:', project?.revenueCatApiKey ? '[SET]' : '[NOT SET]');
console.log('Project ID:', project?.revenueCatProjectId);
console.log('iOS App ID:', project?.revenueCatIosAppId);
console.log('Updated At:', project?.updatedAt);

await freshDb.$disconnect();
process.exit(0);
