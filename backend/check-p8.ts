import { db } from './src/db.js';

async function checkP8Format() {
  const project = await db.project.findFirst({
    where: { name: 'SyncSimp' }
  });

  if (!project || !project.appleP8FileContent) {
    console.log('No P8 file found');
    return;
  }

  console.log('P8 File Content:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(project.appleP8FileContent);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nLength:', project.appleP8FileContent.length, 'characters');
  console.log('Starts with:', project.appleP8FileContent.substring(0, 30));
  console.log('Ends with:', project.appleP8FileContent.substring(project.appleP8FileContent.length - 30));

  process.exit(0);
}

checkP8Format().catch(console.error);
