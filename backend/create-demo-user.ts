import { db } from './src/db';
// eslint-disable-next-line import/no-unresolved
import { hash } from '@node-rs/argon2';

async function createDemoUser() {
  const email = process.env.DEMO_USER_EMAIL || 'demo@syncsimp.app';
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password) {
    console.error('ERROR: Set DEMO_USER_PASSWORD environment variable');
    process.exit(1);
  }
  const name = 'Demo User';

  // Hash password
  const hashedPassword = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  // Check if user exists
  const existing = await db.user.findUnique({
    where: { email }
  });

  if (existing) {
    console.log('Demo user already exists');
    return;
  }

  // Create user
  const user = await db.user.create({
    data: {
      email,
      name,
      emailVerified: true,
      hasCompletedOnboarding: true,
    }
  });

  // Create account with password
  await db.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: hashedPassword,
    }
  });

  console.log('Demo user created successfully!');
  console.log('Email:', email);
}

createDemoUser().catch(console.error).finally(() => process.exit(0));
