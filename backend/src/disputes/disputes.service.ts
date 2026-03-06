import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DisputeStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DisputesService {
    constructor(
        private prisma: PrismaService,
        private readonly notificationsService: NotificationsService
    ) { }

    async create(studentId: string, recordId: string, reason: string) {
        // Verify record belongs to student
        const record = await this.prisma.attendanceRecord.findUnique({
            where: { id: recordId },
            include: {
                student: { select: { name: true } },
                session: { include: { subject: { select: { name: true } } } }
            }
        });

        if (!record || record.studentId !== studentId) {
            throw new ForbiddenException('You can only dispute your own attendance records');
        }

        // Check for existing dispute
        const existing = await this.prisma.attendanceDispute.findFirst({
            where: { recordId }
        });

        if (existing) {
            throw new ForbiddenException('A dispute already exists for this attendance record');
        }

        const dispute = await this.prisma.attendanceDispute.create({
            data: {
                studentId,
                recordId,
                reason,
                status: DisputeStatus.PENDING
            }
        });

        // Notify faculty
        const dateStr = new Date(record.session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        await this.notificationsService.create(
            record.session.facultyId,
            'New Attendance Dispute',
            `${record.student.name} raised a dispute for ${record.session.subject?.name || 'Class'} on ${dateStr}.`
        );

        return dispute;
    }

    async getStudentDisputes(studentId: string) {
        return this.prisma.attendanceDispute.findMany({
            where: { studentId },
            include: {
                record: {
                    include: {
                        session: {
                            include: { subject: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getFacultyDisputes(facultyId: string) {
        return this.prisma.attendanceDispute.findMany({
            where: {
                record: {
                    session: { facultyId }
                }
            },
            include: {
                student: { select: { name: true, rollNumber: true } },
                record: {
                    include: {
                        session: {
                            include: { subject: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async resolveDispute(facultyId: string, disputeId: string, status: DisputeStatus) {
        const dispute = await this.prisma.attendanceDispute.findUnique({
            where: { id: disputeId },
            include: { record: { include: { session: true } } }
        });

        if (!dispute) throw new NotFoundException('Dispute not found');

        if (dispute.record.session.facultyId !== facultyId) {
            throw new ForbiddenException('You can only resolve disputes for your own sessions');
        }

        const updatedDispute = await this.prisma.$transaction(async (tx) => {
            const up = await tx.attendanceDispute.update({
                where: { id: disputeId },
                data: { status }
            });

            // If approved, flip status to PRESENT (student usually disputes ABSENT status)
            if (status === DisputeStatus.APPROVED) {
                await tx.attendanceRecord.update({
                    where: { id: dispute.recordId },
                    data: { status: 'PRESENT' }
                });
            }

            return up;
        });

        // Notify
        await this.notificationsService.create(
            dispute.studentId,
            'Dispute Resolved',
            `Your attendance dispute for ${new Date(dispute.record.session.date).toLocaleDateString()} has been ${status.toLowerCase()}.`
        );

        return updatedDispute;
    }
}
