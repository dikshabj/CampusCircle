import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const subjects = await prisma.subject.findMany({
        include: {
            batch: true,
            faculty: true
        },
        orderBy: [
            { batchId: 'asc' },
            { isLab: 'desc' }
        ]
    });

    console.log("Current Subject Assignments:");
    console.log("--------------------------------------------------");
    subjects.forEach(s => {
        console.log(`[${s.batch.branch} Sem ${s.batch.semester} ${s.batch.section}] | ${s.code} | ${s.isLab ? 'LAB' : 'CLS'} | Faculty: ${s.faculty?.name || 'Unassigned'}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
