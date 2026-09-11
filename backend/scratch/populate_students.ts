import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log("Adding dummy students...");

    // Find all batches to assign students to
    const batches = await prisma.batch.findMany();
    if (batches.length === 0) {
        console.error("❌ No batches found! Please run 'npx prisma db seed' first.");
        return;
    }

    const studentsData = [
        { name: "Rahul Kumar", rollNumberPrefix: "STU10", emailPrefix: "student1" },
        { name: "Priya Sharma", rollNumberPrefix: "STU20", emailPrefix: "student2" },
        { name: "Amit Singh", rollNumberPrefix: "STU30", emailPrefix: "student3" },
        { name: "Neha Gupta", rollNumberPrefix: "STU40", emailPrefix: "student4" },
    ];

    const hashedPassword = await bcrypt.hash('welcome123', 10);
    let totalAdded = 0;

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        for (const data of studentsData) {
            // Make emails and roll numbers unique per batch so we don't get unique constraint errors
            const email = `${data.emailPrefix}_b${i+1}@campusfeed.com`;
            const rollNumber = `${data.rollNumberPrefix}${i+1}`;
            
            await prisma.user.upsert({
                where: { email: email },
                update: { 
                    name: data.name, 
                    role: 'STUDENT', 
                    rollNumber: rollNumber, 
                    isActivated: true,
                    batchId: batch.id 
                },
                create: {
                    name: data.name,
                    email: email,
                    role: 'STUDENT',
                    rollNumber: rollNumber,
                    password: hashedPassword, // 'welcome123'
                    isActivated: true,
                    batchId: batch.id
                }
            });
            totalAdded++;
        }
    }

    console.log(`✅ Successfully added ${totalAdded} activated dummy students across ${batches.length} batches!`);
    console.log(`\nYou can now log in to the frontend as a Student using any of these credentials:`);
    console.log(`- Email or Roll No: student1_b1@campusfeed.com (or STU101)`);
    console.log(`- Password: welcome123\n`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
