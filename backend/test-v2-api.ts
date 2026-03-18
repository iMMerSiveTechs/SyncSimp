// Test the secret key with API v2 - load from environment
const apiKey = process.env.REVENUECAT_SECRET_KEY;
if (!apiKey) {
  console.error('ERROR: Set REVENUECAT_SECRET_KEY environment variable');
  process.exit(1);
}

console.log('Testing RevenueCat API v2 with secret key...\n');

async function testV2() {
  try {
    const response = await fetch("https://api.revenuecat.com/v2/projects", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    console.log('Status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! API v2 works with secret key!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('❌ Failed');
      console.log('Error:', text);
    }
  } catch (error: any) {
    console.log('❌ Request failed:', error.message);
  }
}

testV2();
