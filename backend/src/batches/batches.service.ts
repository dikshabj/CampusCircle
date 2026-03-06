import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/batch.dto';

@Injectable()
export class BatchesService {
    constructor(private prisma: PrismaService) { }

    async create(createBatchDto: CreateBatchDto) {
        const { branch, semester, section } = createBatchDto;

        const existingBatch = await this.prisma.batch.findFirst({
            where: { branch, semester, section },
        });

        if (existingBatch) {
            throw new ConflictException('Batch with these details already exists');
        }

        return this.prisma.batch.create({
            data: createBatchDto,
        });
    }

    async findAll() {
        return this.prisma.batch.findMany({
            include: {
                _count: {
                    select: { users: true },
                },
            },
        });
    }

    async findOne(id: string) {
        const batch = await this.prisma.batch.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        rollNumber: true,
                        email: true,
                    },
                },
            },
        });

        if (!batch) {
            throw new NotFoundException(`Batch with ID ${id} not found`);
        }

        return batch;
    }

    async update(id: string, updateBatchDto: UpdateBatchDto) {
        await this.findOne(id);
        return this.prisma.batch.update({
            where: { id },
            data: updateBatchDto,
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.batch.delete({
            where: { id },
        });
    }
}
