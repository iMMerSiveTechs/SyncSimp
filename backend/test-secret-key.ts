import { PrismaClient } from './generated/prisma/index.js';

async function testSecretKey() {
  const freshDb = new PrismaClient();

  const project = await freshDb.project.findUnique({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
  });

  const apiKey = project?.revenueCatApiKey;

  if (!apiKey) {
    console.error('RevenueCat key is not configured for the selected project.');
    await freshDb.$disconnect();
    process.exitCode = 1;
    return;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 TESTING SECRET KEY FROM DATABASE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');


  console.log('\n--- Testing V1 /projects endpoint ---');

  try {
    const response = await fetch('https://api.revenuecat.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Secret key works!');
      console.log('Projects:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('❌ Failed');
      console.log('Error:', text);
    }
  } catch (error: any) {
    console.log('❌ Request failed:', error.message);
  }

  await freshDb.$disconnect();
  process.exit(0);
}

testSecretKey().catch(console.error);
