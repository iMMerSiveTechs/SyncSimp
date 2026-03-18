const Database = require('better-sqlite3');
const db = new Database('./prisma/dev.db');

console.log('Before update:');
const before = db.prepare('SELECT revenueCatApiKey, updatedAt FROM Project WHERE id = ?').get('304ea0c9-019d-425d-8b9f-051de0cdfbc8');
console.log(before);

console.log('\nUpdating...');
const update = db.prepare('UPDATE Project SET revenueCatApiKey = ?, updatedAt = ? WHERE id = ?');
const testKey = process.env.REVENUECAT_SECRET_KEY || 'test_placeholder';
const result = update.run(testKey, new Date().toISOString(), '304ea0c9-019d-425d-8b9f-051de0cdfbc8');
console.log('Changes:', result.changes);

console.log('\nAfter update:');
const after = db.prepare('SELECT revenueCatApiKey, updatedAt FROM Project WHERE id = ?').get('304ea0c9-019d-425d-8b9f-051de0cdfbc8');
console.log(after);

db.close();
