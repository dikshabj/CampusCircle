const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      facultyId: true,
      rollNumber: true,
      role: true,
      name: true
    },
    take: 20
  });
  console.log('--- Current Users in DB ---');
  console.table(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
