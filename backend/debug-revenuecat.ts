// Test RevenueCat API with detailed debugging

import { db } from './src/db.js';

async function debugRevenueCat() {
  const project = await db.project.findFirst({
    where: { name: 'SyncSimp' }
  });

  if (!project) {
    console.log('No project found');
    return;
  }

  const apiKey = project.revenueCatApiKey!;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 REVENUECAT API KEY DEBUG');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('API Key:', apiKey ? '[SET]' : '[NOT SET]');
  console.log('Key Length:', apiKey.length);
  console.log('Key Type:', apiKey.startsWith('appl_') ? 'SDK/Public Key' : apiKey.startsWith('sk_') ? 'Secret Key' : 'Unknown');

  console.log('\n--- Testing Different API Endpoints ---\n');

  // According to RevenueCat docs, the V2 API might be different
  const tests = [
    { name: 'V1 Projects', url: 'https://api.revenuecat.com/v1/projects' },
    { name: 'V2 Projects', url: 'https://api.revenuecat.com/v2/projects' },
    { name: 'V1 Subscribers (no auth)', url: 'https://api.revenuecat.com/v1/subscribers/test' },
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`URL: ${test.url}`);

      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Platform': 'ios'
        },
      });

      console.log(`Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
      } else {
        const text = await response.text();
        console.log('❌ Failed');
        console.log('Error:', text.substring(0, 200));
      }
      console.log('');
    } catch (error: any) {
      console.log('❌ Request Error:', error.message);
      console.log('');
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check if this is actually a valid public key format
  console.log('🔍 Checking Key Format:');
  const validPublicKeyPattern = /^appl_[A-Za-z0-9]{20,}$/;
  const validSecretKeyPattern = /^sk_[A-Za-z0-9]{20,}$/;

  if (validPublicKeyPattern.test(apiKey)) {
    console.log('✅ Key matches public key format (appl_...)');
  } else if (validSecretKeyPattern.test(apiKey)) {
    console.log('✅ Key matches secret key format (sk_...)');
  } else {
    console.log('❌ Key does NOT match expected format');
    console.log('   Public keys should be: appl_XXXXXXXXXXXX');
    console.log('   Secret keys should be: sk_XXXXXXXXXXXX');
  }

  process.exit(0);
}

debugRevenueCat().catch(console.error);
