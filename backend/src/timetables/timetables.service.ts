import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimetableDto, UpdateTimetableDto } from './dto/timetable.dto';
import csv from 'csv-parser';
import { Readable } from 'stream';

//constants
const TIME_SLOTS = [
    { start: "09:30", end: "10:20" },
    { start: "10:20", end: "11:10" },
    { start: "11:10", end: "12:00" },
    { start: "12:00", end: "12:50" },
    // 12:50 - 13:35 Lunch Break (Skip)
    { start: "13:35", end: "14:20" },
    { start: "14:20", end: "15:05" },
    { start: "15:05", end: "15:50" },
    { start: "15:50", end: "16:35" },
];
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

@Injectable()
export class TimetablesService {
    constructor(private prisma: PrismaService) { }

    private async canTeacherTakeClass(facultyId: string | null, day: any, slotIndex: number) {
        if (!facultyId) return true;

        // 1. Check Specific Availability Settings
        const availability = await this.prisma.facultyAvailability.findUnique({
            where: { facultyId_day: { facultyId, day } }
        });

        if (availability && !availability.isAvailable) return false;

        if (availability?.unavailableFrom && availability?.unavailableTo) {
            const slotStart = TIME_SLOTS[slotIndex].start;
            if (slotStart >= availability.unavailableFrom && slotStart < availability.unavailableTo) {
                return false;
            }
        }

        // 2. Check Daily Limit (Increased to 5 for flexibility)
        const dailyClasses = await this.prisma.timetable.count({
            where: { day, subject: { facultyId } }
        });
        if (dailyClasses >= 5) return false;

        // 3. Conflict Check (Is teacher in another class?)
        const isBusy = await this.prisma.timetable.findFirst({
            where: {
                day,
                startTime: TIME_SLOTS[slotIndex].start,
                subject: { facultyId }
            }
        });

        return !isBusy;
    }

    private async isRoomFree(roomId: string, day: any, startTime: string) {
        if (!roomId) return true;
        const busy = await this.prisma.timetable.findFirst({
            where: { day, startTime, roomId }
        });
        return !busy;
    }

    async generateSmartTimeTable(batchId: string) {
        // 1. Get all subjects for this batch, sorted by priority (High to Low)
        const subjects = await this.prisma.subject.findMany({
            where: { batchId },
            orderBy: { priority: 'desc' }
        });

        // 2. Clear existing entries for this batch
        await this.prisma.timetable.deleteMany({
            where: { batchId }
        });

        const results: any[] = [];
        const unscheduled: string[] = [];

        // Track occupied slots for this batch to avoid internal overlaps
        // day -> boolean array of length TIME_SLOTS.length
        const batchSlots = new Map<string, boolean[]>();
        DAYS.forEach(day => batchSlots.set(day, new Array(TIME_SLOTS.length).fill(false)));

        // 3. Subject-First Scheduling
        // We schedule high-priority subjects first by looking for any available spot across the week
        for (const subject of subjects) {
            const target = subject.weeklyTarget || 3;
            let scheduledCount = 0;

            // Strategy: Try to spread classes by iterating days, but if we miss targets, 
            // we'll be more aggressive in finding ANY slot.
            for (const day of DAYS) {
                if (scheduledCount >= target) break;

                for (let i = 0; i < TIME_SLOTS.length; i++) {
                    if (scheduledCount >= target) break;

                    // A. Batch Check (Is the student free?)
                    if (batchSlots.get(day)![i]) continue;
                    
                    const isLab = subject.isLab;
                    if (isLab) {
                        if (i + 1 >= TIME_SLOTS.length || batchSlots.get(day)![i + 1]) continue;
                    }

                    // B. Teacher Check
                    const teacherOk = await this.canTeacherTakeClass(subject.facultyId, day as any, i);
                    if (!teacherOk) continue;

                    if (isLab) {
                        const teacherNextOk = await this.canTeacherTakeClass(subject.facultyId, day as any, i + 1);
                        if (!teacherNextOk) continue;
                    }

                    // C. Room Check - Try all active rooms of required type
                    const rooms = await this.prisma.room.findMany({
                        where: { type: isLab ? 'LAB' : 'CLASSROOM', isActive: true }
                    });

                    let selectedRoomId: string | null = null;
                    for (const room of rooms) {
                        const roomOk = await this.isRoomFree(room.id, day as any, TIME_SLOTS[i].start);
                        if (!roomOk) continue;

                        if (isLab) {
                            const roomNextOk = await this.isRoomFree(room.id, day as any, TIME_SLOTS[i + 1].start);
                            if (!roomNextOk) continue;
                        }

                        selectedRoomId = room.id;
                        break;
                    }

                    if (selectedRoomId) {
                        // Success! Mark slots as occupied
                        batchSlots.get(day)![i] = true;
                        if (isLab) batchSlots.get(day)![i + 1] = true;

                        const newEntry = await this.prisma.timetable.create({
                            data: {
                                day: day as any,
                                startTime: TIME_SLOTS[i].start,
                                endTime: isLab ? TIME_SLOTS[i + 1].end : TIME_SLOTS[i].end,
                                subjectId: subject.id,
                                batchId: batchId,
                                roomId: selectedRoomId,
                                group: "ALL"
                            }
                        });

                        results.push(newEntry);
                        scheduledCount++;

                        // D. Daily Constraint: If isDaily/DCPD, only one per day
                        if (subject.isDaily || subject.name.toUpperCase().includes('DCPD')) {
                            break; // Move to next day
                        }

                        if (isLab) i++; // Skip next slot
                    }
                }
            }

            if (scheduledCount < target) {
                unscheduled.push(`${subject.name} (${target - scheduledCount} classes missed)`);
            }
        }

        return {
            success: true,
            message: unscheduled.length > 0
                ? `Partial success: ${unscheduled.join(', ')}`
                : `Success! ${results.length} classes generated and targets met.`,
            count: results.length,
            unscheduled: unscheduled.length > 0 ? unscheduled : undefined
        };
    }

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
