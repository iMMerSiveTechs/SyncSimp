import { db } from "./src/db.js";

async function checkSessions() {
  try {
    const sessions = await db.session.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true }
    });

    console.log(`Found ${sessions.length} sessions:`);
    for (const session of sessions) {
      console.log(`\nSession ID: ${session.id}`);
      console.log(`Token (last 8 chars): ...${session.token.slice(-8)}`);
      console.log(`User: ${session.user.email}`);
      console.log(`Created: ${session.createdAt}`);
      console.log(`Expires: ${session.expiresAt}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkSessions();
