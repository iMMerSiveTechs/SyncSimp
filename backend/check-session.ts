import { db } from './src/db.js';

const sessions = await db.session.findMany({
  take: 10,
  include: { user: true },
  orderBy: { createdAt: 'desc' }
});

console.log('Sessions in database:');
sessions.forEach(s => {
  console.log(`- Token: ${s.token}`);
  console.log(`  User: ${s.user?.email}`);
  console.log(`  Expires: ${s.expiresAt}`);
  console.log();
});

process.exit(0);
