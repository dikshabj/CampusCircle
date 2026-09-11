import { PrismaClient, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
    console.log("Adding dummy faculties and assigning them to subjects...");

    const facultyNames = [
        "Dr. Rajesh Sharma", "Prof. Sunita Verma", "Mr. Amit Gupta", "Ms. Priya Singh",
        "Dr. Vikram Malhotra", "Ms. Anjali Rao", "Mr. Rohan Joshi", "Dr. Neha Kapoor",
        "Mr. Sanjay Mehta", "Ms. Kavita Reddy", "Dr. Arun Kumar", "Prof. Deepa Nair",
        "DCPD Trainer 1", "DCPD Trainer 2", "Soft Skills Specialist", "Tech Guru"
    ];

    const createdFaculties: User[] = [];

    const hashedPassword = await bcrypt.hash('welcome123', 10);

    // 1. Create Faculties
    for (let i = 0; i < facultyNames.length; i++) {
        const name = facultyNames[i];
        const email = `faculty${i + 1}@campusfeed.com`;
        const facultyId = `FAC${(1000 + i)}`;

        const user = await prisma.user.upsert({
            where: { email },
            update: { name, role: 'FACULTY', facultyId, isActivated: true, password: hashedPassword },
            create: {
                name,
                email,
                role: 'FACULTY',
                facultyId,
                password: hashedPassword, // Default
                isActivated: true
            }
        });
        createdFaculties.push(user);
    }

    console.log(`✅ Created/Updated ${createdFaculties.length} faculty members.`);

    // 2. Fetch all subjects
    const subjects = await prisma.subject.findMany();
    console.log(`Assigning faculties to ${subjects.length} subjects...`);

    // 3. Assign randomly but try to distribute
    for (let i = 0; i < subjects.length; i++) {
        const faculty = createdFaculties[i % createdFaculties.length];
        
        await prisma.subject.update({
            where: { id: subjects[i].id },
            data: { 
                facultyId: faculty.id,
                priority: subjects[i].priority || (i % 5) + 1,
                weeklyTarget: subjects[i].weeklyTarget || (subjects[i].isLab ? 1 : 3)
            }
        });
    }

    console.log("✨ All subjects assigned to faculties successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
