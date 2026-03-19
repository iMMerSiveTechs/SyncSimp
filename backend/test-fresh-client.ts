import { PrismaClient } from './generated/prisma/index.js';

async function testWithNewClient() {
  // Create a completely fresh client
  const freshDb = new PrismaClient();

  console.log('Step 1: Read current value');
  const before = await freshDb.project.findUnique({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
  });
  console.log('Current RevenueCat Key:', before?.revenueCatApiKey);
  console.log('Current Updated At:', before?.updatedAt);

  console.log('\nStep 2: Update to test value');
  await freshDb.project.update({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' },
    data: {
      revenueCatApiKey: process.env.REVENUECAT_SECRET_KEY || ('test_' + Date.now()),
      updatedAt: new Date()
    }
  });
  console.log('✅ Update executed');

  console.log('\nStep 3: Read again with same client');
  const after1 = await freshDb.project.findUnique({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
  });
  console.log('After update (same client):', after1?.revenueCatApiKey);
  console.log('Updated At:', after1?.updatedAt);

  await freshDb.$disconnect();

  console.log('\nStep 4: Create NEW client and read');
  const freshDb2 = new PrismaClient();
  const after2 = await freshDb2.project.findUnique({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
  });
  console.log('After update (new client):', after2?.revenueCatApiKey);
  console.log('Updated At:', after2?.updatedAt);

  await freshDb2.$disconnect();
  process.exit(0);
}

testWithNewClient().catch(console.error);
