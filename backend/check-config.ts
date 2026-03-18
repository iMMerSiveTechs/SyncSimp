import { PrismaClient } from './generated/prisma/index.js';
import * as yaml from 'js-yaml';

const db = new PrismaClient();

async function checkConfig() {
  const project = await db.project.findUnique({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
  });
  
  if (project?.configYaml) {
    const config: any = yaml.load(project.configYaml);
    console.log('Subscription Group Config:');
    console.log(JSON.stringify(config.apple?.subscriptionGroup, null, 2));
    console.log('\nProducts:');
    console.log(JSON.stringify(config.plans, null, 2));
  }
  
  await db.$disconnect();
}

checkConfig().catch(console.error);
