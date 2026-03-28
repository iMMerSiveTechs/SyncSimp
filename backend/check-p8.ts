import { db } from './src/db.js';

async function checkP8Format() {
  const project = await db.project.findFirst({
    where: { name: 'SyncSimp' }
  });

  if (!project || !project.appleP8FileContent) {
    console.log('No P8 file found');
    return;
  }

  console.log('P8 File Info:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Length:', project.appleP8FileContent.length, 'characters');
  console.log('Has BEGIN header:', project.appleP8FileContent.includes('-----BEGIN PRIVATE KEY-----'));
  console.log('Has END footer:', project.appleP8FileContent.includes('-----END PRIVATE KEY-----'));
  console.log('Format: [CONTENT REDACTED]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(0);
}

checkP8Format().catch(console.error);
