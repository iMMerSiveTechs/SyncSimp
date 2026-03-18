import { db } from './src/db.js';

async function testRevenueCatDirectly() {
  const project = await db.project.findFirst({
    where: { name: 'SyncSimp' }
  });

  if (!project || !project.revenueCatApiKey) {
    console.log('No RevenueCat API key found');
    return;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 TESTING REVENUECAT API KEY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const apiKey = project.revenueCatApiKey;
  console.log('API Key:', apiKey.substring(0, 20) + '...');
  console.log('Project ID:', project.revenueCatProjectId);
  console.log('iOS App ID:', project.revenueCatIosAppId);

  // Test 1: List projects
  console.log('\n📦 TEST 1: List Projects (GET /v1/projects)');
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
      console.log('✅ SUCCESS!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ FAILED');
      console.log('Error:', errorText);
    }
  } catch (error: any) {
    console.log('❌ REQUEST FAILED');
    console.log('Error:', error.message);
  }

  // Test 2: Try getting a specific project
  if (project.revenueCatProjectId) {
    console.log('\n📦 TEST 2: Get Specific Project');
    console.log('Trying project ID:', project.revenueCatProjectId);

    try {
      const response = await fetch(`https://api.revenuecat.com/v1/projects/${project.revenueCatProjectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ FAILED');
        console.log('Error:', errorText);
      }
    } catch (error: any) {
      console.log('❌ REQUEST FAILED');
      console.log('Error:', error.message);
    }
  }

  // Test 3: Try getting app
  if (project.revenueCatProjectId && project.revenueCatIosAppId) {
    console.log('\n📱 TEST 3: Get iOS App');
    console.log('Trying app ID:', project.revenueCatIosAppId);

    try {
      const response = await fetch(`https://api.revenuecat.com/v1/projects/${project.revenueCatProjectId}/apps/${project.revenueCatIosAppId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ FAILED');
        console.log('Error:', errorText);
      }
    } catch (error: any) {
      console.log('❌ REQUEST FAILED');
      console.log('Error:', error.message);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ TEST COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

testRevenueCatDirectly().catch(console.error);
