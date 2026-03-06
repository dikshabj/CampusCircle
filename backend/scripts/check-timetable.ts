import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const batches = await prisma.batch.findMany({
        include: {
            _count: { select: { timetables: true, users: true, subjects: true } }
        }
    });

    console.log('\n--- BATCH SUMMARY ---');
    console.table(batches.map(b => ({
        id: b.id.substring(0, 8) + '...',
        batch: `${b.branch} ${b.semester}/${b.section}`,
        slots: b._count.timetables,
        students: b._count.users,
        subjects: b._count.subjects
    })));

    const subjects = await prisma.subject.findMany({
        include: { batch: true }
    });
    console.log(`\n--- ALL SUBJECTS (${subjects.length}) ---`);
    console.table(subjects.map(s => ({
        name: s.name,
        code: s.code,
        batch: `${s.batch.branch} ${s.batch.semester}/${s.batch.section}`
    })));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
