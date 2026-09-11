import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { Role } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { S3Service } from '../aws/s3.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PostsService {
    constructor(
        private prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
        private readonly s3Service: S3Service
    ) { }

    async create(createPostDto: CreatePostDto, authorId: string, files: Array<Express.Multer.File> = []) {
        const attachUrls: string[] = [];
        if (files && files.length > 0) {
            for (const file of files) {
                const url = await this.s3Service.uploadFile(file, 'posts');
                if (url) attachUrls.push(url);
            }
        }

        const { files: _, ...postData } = createPostDto;

        // Handle conversion from form-data
        const isAssignment = String(createPostDto.isAssignment) === 'true';

        const post = await this.prisma.post.create({
            data: {
                ...postData,
                isAssignment,
                deadline: createPostDto.deadline ? new Date(createPostDto.deadline) : null,
                expiresAt: createPostDto.expiresAt ? new Date(createPostDto.expiresAt) : null,
                attachments: attachUrls,
                authorId,
            },
        });

        // Notify target audience
        const targetUsers = await this.prisma.user.findMany({
            where: {
                role: 'STUDENT',
                ...(createPostDto.batchId ? { batchId: createPostDto.batchId } : {})
            },
            select: { id: true }
        });

        const prefix = isAssignment ? 'New Assignment' : 'New Announcement';
        const notifyMsg = createPostDto.batchId
            ? `${prefix} for your batch: ${post.title}`
            : `${prefix}: ${post.title}`;

        Promise.all(targetUsers.map(u =>
            this.notificationsService.create(u.id, prefix, notifyMsg)
        )).catch(err => console.error('Failed to send post notifications', err));

        return post;
    }

    async findAll(role: Role, batchId?: string) {
        let where: any = {};

        // Students only see posts for their batch or global posts
        if (role === 'STUDENT') {
            where = {
                OR: [
                    { batchId: null },
                    { batchId: batchId },
                ],
            };
        } else if (batchId) {
            where.batchId = batchId;
        }

        return this.prisma.post.findMany({
            where,
            include: {
                author: {
                    select: { name: true, role: true },
                },
                batch: {
                    select: { branch: true, semester: true, section: true },
                },
                comments: {
                    include: { author: { select: { name: true, role: true } } },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: { author: true, batch: true },
        });
        if (!post) throw new NotFoundException('Post not found');
        return post;
    }

    async update(id: string, updatePostDto: UpdatePostDto, userId: string, userRole: Role, files: Array<Express.Multer.File> = []) {
        const post = await this.findOne(id);

        if (post.authorId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException('Not allowed to update this post');
        }

        const attachUrls: string[] = [...post.attachments];
        if (files && files.length > 0) {
            for (const file of files) {
                const url = await this.s3Service.uploadFile(file, 'posts');
                if (url) attachUrls.push(url);
            }
        }

        const { files: _, ...updateData } = updatePostDto;
        const isAssignment = updatePostDto.isAssignment !== undefined
            ? String(updatePostDto.isAssignment) === 'true'
            : post.isAssignment;

        return this.prisma.post.update({
            where: { id },
            data: {
                ...updateData,
                isAssignment,
                deadline: updatePostDto.deadline ? new Date(updatePostDto.deadline) : undefined,
                expiresAt: updatePostDto.expiresAt ? new Date(updatePostDto.expiresAt) : undefined,
                attachments: attachUrls
            },
        });
    }

    async remove(id: string, userId: string, userRole: Role) {
        const post = await this.findOne(id);

        if (post.authorId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException('Not allowed to delete this post');
        }

        return this.prisma.post.delete({ where: { id } });
    }

    async createComment(postId: string, authorId: string, content: string) {
        if (!content || !content.trim()) throw new BadRequestException('Comment content is required');

        const comment = await this.prisma.comment.create({
            data: { content, postId, authorId },
            include: { author: { select: { name: true, role: true } } }
        });

        // Notify post author
        const post = await this.prisma.post.findUnique({ where: { id: postId }, select: { authorId: true, title: true } });
        if (post && post.authorId !== authorId) {
            await this.notificationsService.create(
                post.authorId,
                'New Comment',
                `${comment.author.name} commented on your post "${post.title}"`
            );
        }

        return comment;
    }

    @Cron(CronExpression.EVERY_HOUR)
    async handleDeadlineNotifications() {
        // Find assignments due in the next 24 hours
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const soonAssignments = await this.prisma.post.findMany({
            where: {
                isAssignment: true,
                deadline: {
                    gt: new Date(),
                    lt: tomorrow,
                }
            }
        });

        for (const post of soonAssignments) {
            const targetUsers = await this.prisma.user.findMany({
                where: {
                    role: 'STUDENT',
                    ...(post.batchId ? { batchId: post.batchId } : {})
                }
            });

            for (const user of targetUsers) {
                // To avoid spamming every hour, we could check if a notification was already sent
                // But for simplicity, we just send. In a real app index or flag would be better.
                await this.notificationsService.create(
                    user.id,
                    'Assignment Deadline Soon!',
                    `Reminder: "${post.title}" is due by ${
  post.deadline ? post.deadline.toLocaleString() : "No deadline"
}`
                );
            }
        }
    }
}
