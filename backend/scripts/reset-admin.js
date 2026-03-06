const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@campusfeed.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN'
    },
    create: {
      name: 'Admin',
      email,
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('✅ Admin credentials updated:', email, password);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
