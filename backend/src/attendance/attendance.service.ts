import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/attendance.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AttendanceService {
    constructor(
        private prisma: PrismaService,
        private readonly notificationsService: NotificationsService
    ) { }

    // Get all students for a subject (based on the subject's batch)
    async getStudentsForSubject(subjectId: string) {
        const subject = await this.prisma.subject.findUnique({
            where: { id: subjectId },
            select: { batchId: true },
        });

        if (!subject) throw new NotFoundException('Subject not found');

        return this.prisma.user.findMany({
            where: {
                batchId: subject.batchId,
                role: 'STUDENT'
            },
            select: {
                id: true,
                name: true,
                rollNumber: true,
            },
            orderBy: { rollNumber: 'asc' }
        });
    }

    // Mark/Bulk upsert attendance session and record
    async markAttendance(facultyId: string, dto: CreateAttendanceDto) {
        const { subjectId, date, records } = dto;

        // 1. Re-construct the sessionDate to be midnight UTC (Prisma @db.Date standard)
        // input 'date' is YYYY-MM-DD
        const sessionDate = new Date(date + 'T00:00:00.000Z');

        // 2. Midnight restriction logic: 
        // Get today's UTC midnight date for comparison
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        // If the date being marked is NOT today, block it (Midnight update not allowed)
        if (date !== todayStr) {
            throw new ConflictException('Attendance can only be marked for today. Midnight update is not allowed.');
        }

        // 3. Upsert Session
        const session = await this.prisma.attendanceSession.upsert({
            where: {
                subjectId_date: { subjectId, date: sessionDate }
            },
            update: {}, // Don't update anything if it exists
            create: {
                subjectId,
                facultyId,
                date: sessionDate,
            }
        });

        // 4. Transact bulk update for records
        const operations = records.map(record =>
            this.prisma.attendanceRecord.upsert({
                where: {
                    sessionId_studentId: { sessionId: session.id, studentId: record.studentId }
                },
                update: { status: record.status },
                create: {
                    sessionId: session.id,
                    studentId: record.studentId,
                    status: record.status
                }
            })
        );

        await this.prisma.$transaction(operations);

        // Fetch subject for better notification context
        const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
        const dateStr = sessionDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

        // Asynchronously notify each student of their status without blocking the response
        Promise.all(records.map(record =>
            this.notificationsService.create(
                record.studentId,
                'Attendance Update',
                `You have been marked ${record.status} for ${subject?.name || 'Class'} on ${dateStr}.`
            )
        )).catch(err => console.error('Failed to send attendance notifications', err));

        return { message: 'Attendance marked successfully', sessionId: session.id };
    }

    // Get session details for a subject and date
    async getSession(subjectId: string, date: string) {
        const sessionDate = new Date(date);
        sessionDate.setHours(0, 0, 0, 0);

        const session = await this.prisma.attendanceSession.findUnique({
            where: { subjectId_date: { subjectId, date: sessionDate } },
            include: {
                records: {
                    include: { student: { select: { name: true, rollNumber: true } } }
                }
            }
        });

        if (!session) return null;
        return session;
    }

    async getStudentAttendance(studentId: string) {
        // 1. Get the student to find their batchId
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
            select: { batchId: true }
        });

        if (!student || !student.batchId) return [];

        // 2. Get all subjects for this batch
        const batchSubjects = await this.prisma.subject.findMany({
            where: { batchId: student.batchId },
            select: { id: true, name: true, code: true }
        });

        // 3. Get all attendance records for this student
        const records = await this.prisma.attendanceRecord.findMany({
            where: { studentId },
            include: {
                session: {
                    select: { subjectId: true }
                }
            }
        });

        // 4. Initialize stats with 100% for all subjects
        const stats = {};
        batchSubjects.forEach(sub => {
            stats[sub.id] = { name: sub.name, code: sub.code, present: 0, total: 0 };
        });

        // 5. Update with actual records
        records.forEach(r => {
            const subjectId = r.session.subjectId;
            if (stats[subjectId]) {
                stats[subjectId].total++;
                if (r.status === 'PRESENT') stats[subjectId].present++;
            }
        });

        return Object.values(stats);
    }

    async getStudentDetailedLogs(studentId: string) {
        // 1. Find student's batchId
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
            select: { batchId: true }
        });

        if (!student?.batchId) return [];

        // 2. Get ALL sessions for subjects in this batch
        const sessions = await this.prisma.attendanceSession.findMany({
            where: {
                subject: { batchId: student.batchId }
            },
            include: {
                subject: { select: { name: true, code: true } },
                records: {
                    where: { studentId },
                    select: { id: true, status: true, disputes: { select: { id: true, status: true } } }
                }
            },
            orderBy: { date: 'desc' }
        });

        // 3. Flatten into record-like shape (one entry per session)
        return sessions.map(session => {
            const record = session.records[0]; // student's record for this session (may be null)
            return {
                id: record?.id ?? session.id, // fallback to sessionId so UI has a key
                status: record?.status ?? 'UNMARKED',
                disputes: record?.disputes ?? [],
                session: {
                    date: session.date,
                    subject: session.subject
                }
            };
        });
    }
}
