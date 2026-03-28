import { db } from './src/db.js';
import jwt from 'jsonwebtoken';

const ASC_API_BASE = "https://api.appstoreconnect.apple.com";

function createAscToken(issuerId: string, keyId: string, privateKey: string): string {
  const payload = {
    iss: issuerId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 20 * 60,
    aud: "appstoreconnect-v1",
  };

  return jwt.sign(payload, privateKey, {
    algorithm: "ES256",
    keyid: keyId,
  });
}

async function requestAsc(
  issuerId: string,
  keyId: string,
  privateKey: string,
  path: string
): Promise<any> {
  const token = createAscToken(issuerId, keyId, privateKey);
  const url = `${ASC_API_BASE}${path}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function testValidation() {
  const project = await db.project.findFirst({
    where: { name: 'SyncSimp' }
  });

  if (!project) {
    console.log('No project found!');
    return;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 TESTING VALIDATION FOR SYNCSIMP');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Apple API Credentials
  console.log('📱 TEST 1: Apple API Credentials');
  console.log('   Issuer ID:', project.appleIssuerId);
  console.log('   Key ID:', project.appleKeyId);

  try {
    const response = await requestAsc(
      project.appleIssuerId!,
      project.appleKeyId!,
      project.appleP8FileContent!,
      '/v1/apps?limit=1'
    );
    console.log('   ✅ Apple credentials are VALID');
    console.log('   Found', response.data?.length || 0, 'apps in your account');
  } catch (error: any) {
    console.log('   ❌ Apple credentials FAILED');
    console.log('   Error:', error.message);
  }

  // Test 2: Find app by bundle ID
  console.log('\n📦 TEST 2: Find App by Bundle ID');
  console.log('   Bundle ID:', project.bundleId);

  try {
    const response = await requestAsc(
      project.appleIssuerId!,
      project.appleKeyId!,
      project.appleP8FileContent!,
      `/v1/apps?filter[bundleId]=${encodeURIComponent(project.bundleId)}`
    );

    if (response.data && response.data.length > 0) {
      console.log('   ✅ App FOUND in App Store Connect');
      console.log('   App ID:', response.data[0].id);
      console.log('   App Name:', response.data[0].attributes.name);
      console.log('   Bundle ID:', response.data[0].attributes.bundleId);
    } else {
      console.log('   ❌ App NOT FOUND');
      console.log('   The bundle ID "' + project.bundleId + '" does not exist in App Store Connect');
    }
  } catch (error: any) {
    console.log('   ❌ Search FAILED');
    console.log('   Error:', error.message);
  }

  // Test 3: List all your apps to see what bundle IDs you have
  console.log('\n📋 TEST 3: List All Your Apps');

  try {
    const response = await requestAsc(
      project.appleIssuerId!,
      project.appleKeyId!,
      project.appleP8FileContent!,
      '/v1/apps?limit=200'
    );

    if (response.data && response.data.length > 0) {
      console.log('   Found', response.data.length, 'app(s) in your account:\n');
      for (const app of response.data) {
        console.log('   • ' + app.attributes.name);
        console.log('     Bundle ID: ' + app.attributes.bundleId);
        console.log('     SKU: ' + app.attributes.sku);
        console.log('     App ID: ' + app.id);
        console.log('');
      }
    }
  } catch (error: any) {
    console.log('   ❌ Failed to list apps');
    console.log('   Error:', error.message);
  }

  // Test 4: RevenueCat API
  console.log('🔑 TEST 4: RevenueCat API');
  console.log('   API Key:', project.revenueCatApiKey ? '[SET]' : '[NOT SET]');
  console.log('   Project ID:', project.revenueCatProjectId);
  console.log('   iOS App ID:', project.revenueCatIosAppId);

  try {
    const response = await fetch('https://api.revenuecat.com/v1/projects', {
      headers: {
        'Authorization': `Bearer ${project.revenueCatApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ RevenueCat API key is VALID');
      console.log('   Projects:', data.items?.length || 0);
    } else {
      console.log('   ❌ RevenueCat API key FAILED');
      console.log('   Status:', response.status, response.statusText);
    }
  } catch (error: any) {
    console.log('   ❌ RevenueCat request FAILED');
    console.log('   Error:', error.message);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ VALIDATION TEST COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

testValidation().catch(console.error);
