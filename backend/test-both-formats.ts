// Test both formats: with and without underscore

async function testBothFormats() {
  // Get the API key from database
  const { db } = await import('./src/db.js');

  const project = await db.project.findFirst({
    where: { name: 'SyncSimp' }
  });

  if (!project || !project.revenueCatApiKey) {
    console.log('No API key found');
    return;
  }

  const apiKey = project.revenueCatApiKey;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 TESTING BOTH ID FORMATS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test different project ID formats
  const projectIdFormats = [
    'projf9634011',      // Current in DB (no underscore)
    'proj_f9634011',     // With underscore
    'proj9634011',       // Without 'f'
    'proj_9634011',      // Without 'f', with underscore
    'proj0634011',       // From screenshot
    'proj_0634011',      // From screenshot with underscore
    '9634011',           // Just the number
    'f9634011',          // Just f + number
  ];

  // Test different app ID formats
  const appIdFormats = [
    'app0261cc2e2et',    // Current in DB
    'app_0261cc2e2et',   // With underscore
    'app0261cc2e2e',     // Without 't'
    'app_0261cc2e2e',    // Without 't', with underscore
    '0261cc2e2et',       // Just the ID
    '0261cc2e2e',        // Just the ID without 't'
  ];

  console.log('Testing Project IDs:');
  for (const projId of projectIdFormats) {
    try {
      const response = await fetch(`https://api.revenuecat.com/v1/projects/${projId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log(`✅ SUCCESS with: "${projId}"`);
        const data = await response.json();
        console.log('   Response:', JSON.stringify(data, null, 2));
        break;
      } else if (response.status !== 404) {
        console.log(`⚠️  Non-404 error with "${projId}": ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      console.log(`❌ Error with "${projId}": ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(0);
}

testBothFormats().catch(console.error);
