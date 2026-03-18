// Test different RevenueCat ID formats

const testFormats = [
  // What's currently in database
  { proj: 'projf9634011', app: 'app0261cc2e2et', name: 'Current (no underscore)' },

  // With underscores
  { proj: 'proj_f9634011', app: 'app_0261cc2e2e', name: 'With underscores' },

  // Without the 'f' prefix
  { proj: 'proj9634011', app: 'app0261cc2e2e', name: 'Without f prefix' },
  { proj: 'proj_9634011', app: 'app_0261cc2e2e', name: 'Underscore no f' },

  // The format from screenshot
  { proj: 'proj0634011', app: 'app0261cc2e2e', name: 'From screenshot (no underscore)' },
];

// You need to get the REAL values from RevenueCat
console.log('\n=== REVENUECAT ID FORMAT GUIDE ===\n');
console.log('To find your REAL Project ID:');
console.log('1. Go to app.revenuecat.com');
console.log('2. Click the gear icon ⚙️ next to your project name "SyncSimp (App Store)"');
console.log('3. Look at the URL - it should be: app.revenuecat.com/projects/XXXXX/settings');
console.log('4. That XXXXX in the URL is your Project ID');
console.log('   OR look for "Project ID" label at the top of the settings page\n');

console.log('To find your REAL App ID:');
console.log('1. Click "Apps" in the left sidebar');
console.log('2. Click your iOS app "SyncSimp (App Store)"');
console.log('3. Look at the URL - it should be: app.revenuecat.com/projects/XXXXX/apps/YYYYY');
console.log('4. That YYYYY in the URL is your App ID');
console.log('   OR look for "App ID" label at the top of the app page\n');

console.log('Current test formats:');
testFormats.forEach(f => {
  console.log(`- ${f.name}: proj="${f.proj}", app="${f.app}"`);
});

console.log('\n=== IMPORTANT ===');
console.log('Look at the URL bar when you have Project Settings open!');
console.log('The URL will show the exact format RevenueCat uses.');
