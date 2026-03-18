// Test the V2 secret key - load from environment
const v2ApiKey = process.env.REVENUECAT_SECRET_KEY;
if (!v2ApiKey) {
  console.error('ERROR: Set REVENUECAT_SECRET_KEY environment variable');
  process.exit(1);
}

console.log('Testing RevenueCat API v2 with V2 secret key...\n');

async function testV2() {
  try {
    const response = await fetch("https://api.revenuecat.com/v2/projects", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${v2ApiKey}`,
        "Content-Type": "application/json",
      },
    });

    console.log('Status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! V2 API key works!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response status indicates:',
        response.status === 401 ? '❌ Invalid key' :
        response.status === 403 ? '❌ Wrong key version or permissions' :
        response.status === 404 ? '✅ Key is valid (no projects found - that\'s ok!)' :
        '❌ Error'
      );
      console.log('Error:', text);
    }
  } catch (error: any) {
    console.log('❌ Request failed:', error.message);
  }
}

testV2();
