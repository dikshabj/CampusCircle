import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        const { email, rollNumber, facultyId, password, ...rest } = createUserDto;

        // Check for existing user by uniqueness
        if (email) {
            const existingEmail = await this.prisma.user.findUnique({ where: { email } });
            if (existingEmail) throw new ConflictException('Email already in use');
        }

        if (rollNumber) {
            const existingRoll = await this.prisma.user.findUnique({ where: { rollNumber } });
            if (existingRoll) throw new ConflictException('Roll number already exists');
        }

        if (facultyId) {
            const existingFaculty = await this.prisma.user.findUnique({ where: { facultyId } });
            if (existingFaculty) throw new ConflictException('Faculty ID already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        return this.prisma.user.create({
            data: {
                ...rest,
                email,
                rollNumber,
                facultyId,
                password: hashedPassword,
            },
        });
    }

    async findAll(role?: string) {
        return this.prisma.user.findMany({
            where: role ? { role: role as any } : {},
            include: {
                batch: true,
                mentorBatch: true,
            },
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                batch: true,
                mentorBatch: true,
            },
        });

        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const { password, ...rest } = updateUserDto;

        let data: any = { ...rest };
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }

    async bulkUpload(file: Express.Multer.File, role: Role) {
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

        let count = 0;
        const createdUsers: any[] = [];

        for (const row of results) {
            // Student CSV: name, email, rollNumber, branch, semester, section
            // Faculty CSV: name, email, facultyId, branch
            try {
                const identifier = (role === 'STUDENT' ? (row.rollNumber || row.roll) : (row.facultyId || row.id))?.toString()?.trim();
                if (!identifier || !row.name?.trim()) continue;

                if (!row.email?.trim()) {
                    console.error(`Row missing email: ${JSON.stringify(row)}`);
                    continue;
                }

                const defaultPassword = 'welcome123';

                const data: any = {
                    name: row.name.trim(),
                    email: row.email.trim(),
                    role: role,
                    password: await bcrypt.hash(defaultPassword, 10),
                    isFirstLogin: true
                };

                if (role === 'STUDENT') {
                    data.rollNumber = identifier;

                    // Auto-create or find batch from CSV columns
                    if (row.branch && row.semester && row.section) {
                        const batch = await this.prisma.batch.upsert({
                            where: {
                                branch_semester_section: {
                                    branch: row.branch.trim().toUpperCase(),
                                    semester: parseInt(row.semester),
                                    section: row.section.trim().toUpperCase()
                                }
                            },
                            update: {},
                            create: {
                                branch: row.branch.trim().toUpperCase(),
                                semester: parseInt(row.semester),
                                section: row.section.trim().toUpperCase()
                            }
                        });
                        data.batchId = batch.id;
                    }
                }

                if (role === 'FACULTY') data.facultyId = identifier;

                await this.prisma.user.upsert({
                    where: { email: data.email },
                    update: {
                        batchId: data.batchId,
                        rollNumber: data.rollNumber,
                        facultyId: data.facultyId,
                        name: data.name
                    },
                    create: data
                });

                createdUsers.push({
                    email: data.email,
                    name: data.name,
                    password: defaultPassword,
                    id: identifier
                });
                count++;
            } catch (err) {
                console.error(`Failed to upload row: ${JSON.stringify(row)}`, err);
            }
        }

        return {
            message: `Successfully processed ${count} records. Default password: welcome123`,
            count,
            createdUsers
        };
    }

    async changePassword(id: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');

        const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isMatch) throw new BadRequestException('Incorrect current password');

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                isFirstLogin: false
            }
        });

        return { message: 'Password changed successfully' };
    }
}
