import { PrismaClient } from './generated/prisma/index.js';

const db = new PrismaClient();

async function checkStatus() {
  const project = await db.project.findUnique({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
  });
  
  console.log('Sync Status:', project?.syncStatus);
  console.log('Last Sync At:', project?.lastSyncAt);
  
  await db.$disconnect();
}

checkStatus().catch(console.error);
