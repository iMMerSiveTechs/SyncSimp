// Test fetching apps from the project - load from environment
const v2ApiKey = process.env.REVENUECAT_SECRET_KEY;
if (!v2ApiKey) {
  console.error('ERROR: Set REVENUECAT_SECRET_KEY environment variable');
  process.exit(1);
}
const projectId = 'projf9634011';

console.log('Fetching apps from project...\n');

async function getApps() {
  try {
    const response = await fetch(`https://api.revenuecat.com/v2/projects/${projectId}/apps`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${v2ApiKey}`,
        "Content-Type": "application/json",
      },
    });

    console.log('Status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Apps found!');
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

getApps();
