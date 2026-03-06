import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarksDto } from './dto/mark.dto';
import { ExamType } from '@prisma/client';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MarksService {
    constructor(
        private prisma: PrismaService,
        private readonly notificationsService: NotificationsService
    ) { }

    // Save/Update marks in bulk
    async saveMarks(dto: CreateMarksDto) {
        const { subjectId, examType, records } = dto;
        const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });

        const operations = records.map(record =>
            this.prisma.mark.upsert({
                where: {
                    studentId_subjectId_examType: {
                        studentId: record.studentId,
                        subjectId,
                        examType
                    }
                },
                update: { marks: record.marks },
                create: {
                    studentId: record.studentId,
                    subjectId,
                    examType,
                    marks: record.marks
                }
            })
        );

        await this.prisma.$transaction(operations);

        // Notify students
        for (const r of records) {
            await this.notificationsService.create(
                r.studentId,
                'Marks Published',
                `Your marks for ${subject?.name || 'Subject'} (${examType}) have been updated.`
            );
        }

        return { message: 'Marks saved successfully' };
    }

    // Get marks for a subject and exam
    async getMarks(subjectId: string, examType: any) {
        return this.prisma.mark.findMany({
            where: { subjectId, examType },
            include: { student: { select: { name: true, rollNumber: true } } }
        });
    }

    // Get student result
    async getStudentMarks(studentId: string) {
        return this.prisma.mark.findMany({
            where: { studentId },
            include: {
                subject: { select: { name: true, code: true } }
            },
            orderBy: { subject: { code: 'asc' } }
        });
    }

    async bulkUpload(file: Express.Multer.File, subjectId: string, examType: ExamType) {
        if (!file) throw new BadRequestException('No file uploaded');

        const results: any[] = [];
        const stream = Readable.from(file.buffer);

        await new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
        let successCount = 0;
        let failCount = 0;

        for (const row of results) {
            // expected CSV headers: rollNumber, marks
            try {
                const rollNumber = row.rollNumber || row.roll;
                const marksValue = parseFloat(row.marks);

                if (isNaN(marksValue) || marksValue < 0 || marksValue > 100) {
                    failCount++;
                    continue;
                }

                const student = await this.prisma.user.findUnique({
                    where: { rollNumber }
                });

                if (!student) {
                    failCount++;
                    continue;
                }

                await this.prisma.mark.upsert({
                    where: {
                        studentId_subjectId_examType: {
                            studentId: student.id,
                            subjectId,
                            examType
                        }
                    },
                    update: { marks: marksValue },
                    create: {
                        studentId: student.id,
                        subjectId,
                        examType,
                        marks: marksValue
                    }
                });

                // Notify
                await this.notificationsService.create(
                    student.id,
                    'Marks Published (Bulk)',
                    `Your marks for ${subject?.name || 'Subject'} (${examType}) have been updated.`
                );

                successCount++;
            } catch (err) {
                console.error(`Failed to process row: ${JSON.stringify(row)}`, err);
                failCount++;
            }
        }

        return {
            message: `Bulk update complete. Success: ${successCount}, Failed: ${failCount}`,
            successCount,
            failCount
        };
    }
}
