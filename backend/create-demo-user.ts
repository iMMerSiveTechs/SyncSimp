import { db } from './src/db';
// eslint-disable-next-line import/no-unresolved
import { hash } from '@node-rs/argon2';

async function createDemoUser() {
  const email = 'demo@syncsimp.app';
  const password = 'SyncDemo2024!';
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

  console.log('✅ Demo user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
}

createDemoUser().catch(console.error).finally(() => process.exit(0));
