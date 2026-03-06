
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkAdmin() {
  const email = 'admin@campusfeed.com';
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User found:', { 
    id: user.id, 
    email: user.email, 
    role: user.role, 
    name: user.name 
  });
  
  const isValid = await bcrypt.compare('admin123', user.password);
  console.log('Password valid:', isValid);
}

checkAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
