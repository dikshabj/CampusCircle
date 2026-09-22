import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const AVAILABLE_SKILLS = [
  'React', 'Node.js', 'Python', 'Java', 'SQL', 
  'MongoDB', 'AWS', 'Docker', 'C++', 'UI/UX',
  'Figma', 'TypeScript', 'GraphQL', 'Next.js', 'Express'
];

async function main() {
  console.log('🌱 Seeding skills for existing students...');

  // 1. Create or get all available skills
  const skillRecords: any[] = [];
  for (const skillName of AVAILABLE_SKILLS) {
    const skill = await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName },
    });
    skillRecords.push(skill);
  }
  console.log(`✅ Created/verified ${skillRecords.length} skills.`);

  // 2. Fetch all students
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' }
  });

  if (students.length === 0) {
    console.log('⚠️ No students found in the database. Please run populate_students.ts first.');
    return;
  }

  console.log(`👨‍🎓 Found ${students.length} students. Assigning random skills...`);

  // 3. Assign 2-5 random skills to each student
  for (const student of students) {
    // Clear existing skills for this student to avoid duplicates on re-run
    await prisma.studentSkill.deleteMany({
      where: { studentId: student.id }
    });

    const numSkills = Math.floor(Math.random() * 4) + 2; // 2 to 5 skills
    const shuffledSkills = [...skillRecords].sort(() => 0.5 - Math.random());
    const selectedSkills = shuffledSkills.slice(0, numSkills);

    for (const skill of selectedSkills) {
      await prisma.studentSkill.create({
        data: {
          studentId: student.id,
          skillId: skill.id
        }
      });
    }
  }

  // 4. Give AI Access to the first Admin (for testing)
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { hasAiAccess: true }
    });
    console.log(`✨ Granted AI Access to Admin: ${admin.email}`);
  }

  console.log('✅ Skill seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
