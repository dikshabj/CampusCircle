import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MentorshipService {
    constructor(private prisma: PrismaService) { }

    async getMentorBatchInfo(mentorId: string) {
        const mentor = await this.prisma.user.findUnique({
            where: { id: mentorId },
            include: { mentorBatch: true }
        });

        if (!mentor || !mentor.isMentor || !mentor.mentorBatch) {
            throw new ForbiddenException('You are not assigned as a mentor to any batch');
        }

        return mentor.mentorBatch;
    }

    async getBatchStudents(mentorId: string) {
        const batch = await this.getMentorBatchInfo(mentorId);

        const students = await this.prisma.user.findMany({
            where: { batchId: batch.id, role: 'STUDENT' },
            select: {
                id: true,
                name: true,
                rollNumber: true,
                email: true,
                _count: {
                    select: {
                        attendanceRecords: true,
                        marks: true
                    }
                }
            },
            orderBy: { rollNumber: 'asc' }
        });

        // Calculate attendance summary for each
        const report = await Promise.all(students.map(async (s) => {
            const sessions = await this.prisma.attendanceSession.findMany({
                where: { subject: { batchId: batch.id } }
            });

            const records = await this.prisma.attendanceRecord.findMany({
                where: { studentId: s.id }
            });

            const presentCount = records.filter(r => r.status === 'PRESENT').length;
            const totalCount = records.length;

            return {
                ...s,
                attendancePct: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0,
                totalSessions: totalCount
            };
        }));

        return report;
    }

    async getStudentFullReport(mentorId: string, studentId: string) {
        const batch = await this.getMentorBatchInfo(mentorId);

        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
            include: { batch: true }
        });

        if (!student || student.batchId !== batch.id) {
            throw new ForbiddenException('Student does not belong to your mentored batch');
        }

        // 1. Attendance Subject-wise
        const subjects = await this.prisma.subject.findMany({
            where: { batchId: batch.id }
        });

        const attendanceReport = await Promise.all(subjects.map(async sub => {
            const records = await this.prisma.attendanceRecord.findMany({
                where: {
                    studentId,
                    session: { subjectId: sub.id }
                }
            });
            const present = records.filter(r => r.status === 'PRESENT').length;
            return {
                subjectName: sub.name,
                subjectCode: sub.code,
                present,
                total: records.length,
                pct: records.length > 0 ? Math.round((present / records.length) * 100) : 0
            };
        }));

        // 2. Marks Subject-wise
        const marks = await this.prisma.mark.findMany({
            where: { studentId },
            include: { subject: true }
        });

        return {
            student: {
                name: student.name,
                rollNumber: student.rollNumber,
                batch: student.batch
            },
            attendance: attendanceReport,
            marks: marks.map(m => ({
                subject: m.subject.name,
                exam: m.examType,
                score: m.marks
            }))
        };
    }
}
