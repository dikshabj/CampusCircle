import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database for CSE Smart Scheduler...');

  // 1. Create Classrooms and Labs
  const roomsData = [
    { name: 'C1', type: 'CLASSROOM' as const },
    { name: 'C2', type: 'CLASSROOM' as const },
    { name: 'C3', type: 'CLASSROOM' as const },
    { name: 'L1 (Java/OOPS)', type: 'LAB' as const },
    { name: 'L2 (DBMS/OS)', type: 'LAB' as const },
    { name: 'L3 (Maths/FBT)', type: 'LAB' as const },
    { name: 'L4 (DCPD/SoftSkills)', type: 'LAB' as const },
    { name: 'L5 (AI/ML)', type: 'LAB' as const },
    { name: 'L6 (Blockchain/IOT)', type: 'LAB' as const },
    { name: 'L7 (General Lab)', type: 'LAB' as const },
  ];

  for (const room of roomsData) {
    await prisma.room.upsert({
      where: { name: room.name },
      update: {},
      create: room,
    });
  }

  // 2. Create Batches
  const branches = ['CSE-CORE', 'CSE-AIML', 'CSE-IOT'];
  for (const branchName of branches) {
    const batch = await prisma.batch.upsert({
      where: { branch_semester_section: { branch: branchName, semester: 4, section: 'A' } },
      update: {},
      create: { branch: branchName, semester: 4, section: 'A' }
    });

    // 3. Subjects List for the batch
    const subjects = [
      { name: 'Java Programming', code: `JAVA-${branchName}`, priority: 5, isLab: true, isDaily: false, weeklyTarget: 4 },
      { name: 'DCPD (Verbal/Apt)', code: `DCPD-${branchName}`, priority: 5, isLab: true, isDaily: true, weeklyTarget: 5 },
      { name: 'OOPS with C++', code: `OOPS-${branchName}`, priority: 4, isLab: true, isDaily: false, weeklyTarget: 4 },
      { name: 'DBMS', code: `DBMS-${branchName}`, priority: 4, isLab: true, isDaily: false, weeklyTarget: 4 },
      { name: 'Maths (FBT Lab)', code: `MATH-${branchName}`, priority: 3, isLab: true, isDaily: false, weeklyTarget: 3 },
      { name: 'Operating Systems', code: `OS-${branchName}`, priority: 3, isLab: false, isDaily: false, weeklyTarget: 3 },
      { name: 'COA', code: `COA-${branchName}`, priority: 3, isLab: false, isDaily: false, weeklyTarget: 3 },
    ];

    // Branch Specific Subject
    if (branchName === 'CSE-CORE') {
      subjects.push({ name: 'Blockchain', code: `BC-${branchName}`, priority: 4, isLab: false, isDaily: false, weeklyTarget: 3 });
    } else if (branchName === 'CSE-AIML') {
      subjects.push({ name: 'Artificial Intelligence', code: `AI-${branchName}`, priority: 4, isLab: true, isDaily: false, weeklyTarget: 3 });
    } else if (branchName === 'CSE-IOT') {
      subjects.push({ name: 'IOT Systems', code: `IOT-${branchName}`, priority: 4, isLab: true, isDaily: false, weeklyTarget: 3 });
    }

    for (const sub of subjects) {
      await prisma.subject.upsert({
        where: { code_batchId: { code: sub.code, batchId: batch.id } },
        update: sub,
        create: { ...sub, batchId: batch.id }
      });
    }
  }

  console.log('✅ Seeding complete! All Batches, Rooms, and Subjects are ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
