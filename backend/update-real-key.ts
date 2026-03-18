import { PrismaClient } from './generated/prisma/index.js';

// Your real RevenueCat secret key
const realSecretKey = 'sk_xsLvUNzfQAvMNcrCbSPyhPdYYVUQu';

async function updateWithRealKey() {
  const freshDb = new PrismaClient();

  console.log('Updating database with your real RevenueCat secret key...');

  await freshDb.project.update({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' },
    data: {
      revenueCatApiKey: realSecretKey,
      updatedAt: new Date()
    }
  });

  console.log('✅ Database updated!');

  const verify = await freshDb.project.findUnique({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
  });

  console.log('\nVerified - RevenueCat API Key:', verify?.revenueCatApiKey);

  await freshDb.$disconnect();
  process.exit(0);
}

updateWithRealKey().catch(console.error);
