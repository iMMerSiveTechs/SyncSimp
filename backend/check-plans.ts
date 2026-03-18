import { PrismaClient } from './generated/prisma/index.js';

const db = new PrismaClient();

async function checkPlans() {
  const project = await db.project.findUnique({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' },
    include: { plans: true }
  });
  
  console.log('Project Plans:', JSON.stringify(project?.plans, null, 2));
  
  await db.$disconnect();
}

checkPlans().catch(console.error);
