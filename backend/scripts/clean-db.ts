import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Cleaning Database ---');

    // Order matters due to foreign key constraints
    await prisma.notification.deleteMany({});
    await prisma.mark.deleteMany({});
    await prisma.attendanceDispute.deleteMany({});
    await prisma.attendanceRecord.deleteMany({});
    await prisma.attendanceSession.deleteMany({});
    await prisma.timetable.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.subject.deleteMany({});

    // Delete all users except ADMIN
    const deleteUsers = await prisma.user.deleteMany({
        where: {
            role: {
                not: 'ADMIN'
            }
        }
    });
    console.log(`Deleted ${deleteUsers.count} non-admin users.`);

    // Delete all batches
    const deleteBatches = await prisma.batch.deleteMany({});
    console.log(`Deleted ${deleteBatches.count} batches.`);

    console.log('--- Database Cleaned ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
