import { PrismaClient } from './generated/prisma/index.js';

// Load API key from environment variable - NEVER hardcode secrets
const v2SecretKey = process.env.REVENUECAT_SECRET_KEY;
if (!v2SecretKey) {
  console.error('ERROR: Set REVENUECAT_SECRET_KEY environment variable');
  process.exit(1);
}

async function updateWithV2Key() {
  const freshDb = new PrismaClient();

  console.log('Updating database with V2 secret key...');

  await freshDb.project.update({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' },
    data: {
      revenueCatApiKey: v2SecretKey,
      updatedAt: new Date()
    }
  });

  console.log('✅ Database updated with V2 key!');

  const verify = await freshDb.project.findUnique({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
  });

  console.log('\nVerified - RevenueCat API Key:', verify?.revenueCatApiKey ? '[SET]' : '[NOT SET]');

  await freshDb.$disconnect();
  process.exit(0);
}

updateWithV2Key().catch(console.error);
