import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimetableDto, UpdateTimetableDto } from './dto/timetable.dto';
import csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class TimetablesService {
    constructor(private prisma: PrismaService) { }

    async create(createTimetableDto: CreateTimetableDto) {
        return this.prisma.timetable.create({
            data: createTimetableDto,
        });
    }

    async bulkImport(file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        const stream = Readable.from(file.buffer);
        return this.processCsvStream(stream);
    }

    async bulkImportLink(url: string) {
        if (!url) throw new BadRequestException('No URL provided');
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
            const text = await response.text();
            const stream = Readable.from(text);
            return this.processCsvStream(stream);
        } catch (err) {
            throw new BadRequestException(`Failed to import from link: ${err.message}`);
        }
    }

    private async processCsvStream(stream: Readable) {
        const results: any[] = [];
        await new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        let count = 0;
        const errors: string[] = [];

        for (const rawRow of results) {
            const row: any = {};
            Object.keys(rawRow).forEach(key => {
                row[key.trim().toLowerCase()] = rawRow[key]?.trim();
            });

            try {
                const day = row.day?.toUpperCase();
                const startTime = row.starttime;
                const endTime = row.endtime;
                const subjectName = row.subjectname;
                const subjectCode = row.subjectcode;
                const branch = row.branch?.toUpperCase();
                const semester = parseInt(row.semester);
                const section = row.section?.toUpperCase();
                const facultyEmail = row.facultyemail;

                if (!day || !startTime || !endTime || !subjectName || !subjectCode || !branch || isNaN(semester) || !section) {
                    errors.push(`Row skipped (missing or invalid fields): ${JSON.stringify(row)}`);
                    continue;
                }

                const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
                if (!validDays.includes(day)) {
                    errors.push(`Invalid day "${day}" for ${subjectCode}`);
                    continue;
                }

                const batch = await this.prisma.batch.upsert({
                    where: { branch_semester_section: { branch, semester, section } },
                    update: {},
                    create: { branch, semester, section }
                });

                let facultyId: string | null = null;
                if (facultyEmail) {
                    const faculty = await this.prisma.user.findUnique({ where: { email: facultyEmail } });
                    if (faculty && faculty.role === 'FACULTY') facultyId = faculty.id;
                }

                const subject = await this.prisma.subject.upsert({
                    where: { code_batchId: { code: subjectCode, batchId: batch.id } },
                    update: facultyId ? { facultyId } : {},
                    create: { name: subjectName, code: subjectCode, batchId: batch.id, facultyId }
                });

                const existingSlot = await this.prisma.timetable.findFirst({
                    where: { day: day as any, startTime, batchId: batch.id }
                });

                if (!existingSlot) {
                    await this.prisma.timetable.create({
                        data: { day: day as any, startTime, endTime, subjectId: subject.id, batchId: batch.id }
                    });
                } else {
                    await this.prisma.timetable.update({
                        where: { id: existingSlot.id },
                        data: { endTime, subjectId: subject.id }
                    });
                }
                count++;
            } catch (err) {
                errors.push(`Error in row: ${err.message}`);
                console.error('Import Row Error:', err);
            }
        }

        return {
            message: `Successfully processed ${count} slots.`,
            count,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    async findAll(batchId?: string) {
        return this.prisma.timetable.findMany({
            where: batchId ? { batchId } : {},
            include: {
                subject: true,
                batch: true,
            },
            orderBy: [
                { day: 'asc' },
                { startTime: 'asc' },
            ],
        });
    }

    async findOne(id: string) {
        const timetable = await this.prisma.timetable.findUnique({
            where: { id },
            include: {
                subject: true,
                batch: true,
            },
        });

        if (!timetable) throw new NotFoundException('Timetable entry not found');
        return timetable;
    }

    async update(id: string, updateTimetableDto: UpdateTimetableDto) {
        return this.prisma.timetable.update({
            where: { id },
            data: updateTimetableDto,
        });
    }

    async remove(id: string) {
        return this.prisma.timetable.delete({ where: { id } });
    }

    async saveAiTimetable(data: {
        batch: { branch: string, semester: number, section: string },
        slots: { day: string, startTime: string, endTime: string, subject: string }[]
    }) {
        const branch = data.batch.branch.toUpperCase();
        const semester = data.batch.semester;
        const section = data.batch.section.toUpperCase();

        // 1. Find or create batch
        const batch = await this.prisma.batch.upsert({
            where: { branch_semester_section: { branch, semester, section } },
            update: {},
            create: { branch, semester, section }
        });

        // 2. Clear existing entries for this batch to ensure fresh start
        await this.prisma.timetable.deleteMany({
            where: { batchId: batch.id }
        });

        let count = 0;
        for (const slot of data.slots) {
            // 3. Find or create subject
            // We'll use the subject name to find a match or create a code
            const subjectCode = slot.subject.trim().substring(0, 10).toUpperCase();

            // Try to find a subject in this batch with this name OR code
            let subject = await this.prisma.subject.findFirst({
                where: {
                    batchId: batch.id,
                    OR: [
                        { name: { equals: slot.subject, mode: 'insensitive' } },
                        { code: subjectCode }
                    ]
                }
            });

            if (!subject) {
                subject = await this.prisma.subject.create({
                    data: {
                        name: slot.subject,
                        code: subjectCode,
                        batchId: batch.id
                    }
                });
            }

            // 4. Create slot
            await this.prisma.timetable.create({
                data: {
                    day: slot.day.toUpperCase() as any,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    subjectId: subject.id,
                    batchId: batch.id
                }
            });
            count++;
        }

        return {
            success: true,
            message: `Successfully saved ${count} slots for ${branch} Sem ${semester} (${section}).`,
            count
        };
    }
}
