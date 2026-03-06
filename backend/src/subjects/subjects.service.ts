import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class SubjectsService {
    constructor(private prisma: PrismaService) { }

    async create(createSubjectDto: CreateSubjectDto) {
        const { name, code, batchId, facultyId } = createSubjectDto;

        const existingSubject = await this.prisma.subject.findUnique({
            where: {
                code_batchId: {
                    code,
                    batchId,
                },
            },
        });

        if (existingSubject) {
            throw new ConflictException('Subject with this code already exists for this batch');
        }

        return this.prisma.subject.create({
            data: createSubjectDto,
        });
    }

    async findAll(batchId?: string, facultyId?: string) {
        const where: any = {};
        if (batchId) where.batchId = batchId;
        if (facultyId) where.facultyId = facultyId;

        return this.prisma.subject.findMany({
            where,
            include: {
                batch: true,
                faculty: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        const subject = await this.prisma.subject.findUnique({
            where: { id },
            include: {
                batch: true,
                faculty: true,
                timetables: true,
            },
        });

        if (!subject) throw new NotFoundException('Subject not found');
        return subject;
    }

    async update(id: string, updateSubjectDto: UpdateSubjectDto) {
        return this.prisma.subject.update({
            where: { id },
            data: updateSubjectDto,
        });
    }

    async remove(id: string) {
        return this.prisma.subject.delete({ where: { id } });
    }
}
