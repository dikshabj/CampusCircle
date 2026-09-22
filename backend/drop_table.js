const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "AiDocument" CASCADE');
  console.log('Dropped table');
}

main().catch(console.error).finally(() => prisma.$disconnect());
