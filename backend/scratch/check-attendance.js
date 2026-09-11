const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const records = await prisma.attendanceRecord.findMany({
        include: {
            session: {
                include: { subject: true }
            },
            student: true
        }
    });

    console.log(`Found ${records.length} attendance records.`);
    if (records.length > 0) {
        console.log("Here are the latest marked attendances:");
        records.forEach(r => {
            console.log(`- Subject: ${r.session.subject.name} (Batch: ${r.session.subject.batchId})`);
            console.log(`  Student: ${r.student.email}`);
            console.log(`  Status:  ${r.status}`);
        });
    } else {
        console.log("No attendance has been marked in the database yet.");
    }
}

check().then(() => prisma.$disconnect());
