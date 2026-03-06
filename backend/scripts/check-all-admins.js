const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true, name: true }
  });
  console.log('Admins in DB:', JSON.stringify(admins, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
