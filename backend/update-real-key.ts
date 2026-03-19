import { PrismaClient } from './generated/prisma/index.js';

// Load API key from environment variable - NEVER hardcode secrets
const realSecretKey = process.env.REVENUECAT_SECRET_KEY;
if (!realSecretKey) {
  console.error('ERROR: Set REVENUECAT_SECRET_KEY environment variable');
  process.exit(1);
}

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

  console.log('\nVerified - RevenueCat API Key:', verify?.revenueCatApiKey ? '[SET]' : '[NOT SET]');

  await freshDb.$disconnect();
  process.exit(0);
}

updateWithRealKey().catch(console.error);
