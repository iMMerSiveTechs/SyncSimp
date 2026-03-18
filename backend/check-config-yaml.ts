import { PrismaClient } from './generated/prisma/index.js';
import * as yaml from 'js-yaml';

const db = new PrismaClient();

async function checkConfig() {
  const project = await db.project.findUnique({
    where: { id: '304ea0c9-019d-425d-8b9f-051de0cdfbc8' }
  });
  
  if (project?.configYaml) {
    console.log('Config YAML exists!');
    const config: any = yaml.load(project.configYaml);
    console.log('\nPlans in YAML:', JSON.stringify(config.plans, null, 2));
  } else {
    console.log('No configYaml found in database');
  }
  
  await db.$disconnect();
}

checkConfig().catch(console.error);
