import { PrismaClient } from './generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', JSON.stringify(users, null, 2));
  
  const projects = await prisma.project.findMany();
  console.log('Projects:', JSON.stringify(projects, null, 2));
  
  const sessions = await prisma.session.findMany();
  console.log('Sessions:', JSON.stringify(sessions, null, 2));
}

main().finally(() => prisma.$disconnect());
