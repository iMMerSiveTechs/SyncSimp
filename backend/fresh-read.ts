// Force-close all connections and read fresh
import { PrismaClient } from '@prisma/client';

async function freshRead() {
  const prisma = new PrismaClient();

  const project = await prisma.project.findFirst({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
  });

  console.log('\n=== FRESH READ ===\n');
  console.log('RevenueCat API Key:', project?.revenueCatApiKey ? '[SET]' : '[NOT SET]');
  console.log('Updated At:', project?.updatedAt);

  await prisma.$disconnect();
  process.exit(0);
}

freshRead().catch(console.error);
