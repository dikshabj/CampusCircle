import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    async onModuleInit() {
        await this.seedAdmin();
    }

    private async seedAdmin() {
        const email = this.configService.get<string>('ADMIN_EMAIL') || 'admin@campusfeed.com';
        const password = this.configService.get<string>('ADMIN_PASSWORD') || 'admin123';

        const existingAdmin = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            this.logger.log(`Admin already exists: ${email}`);
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.prisma.user.create({
            data: {
                name: 'Admin User',
                email,
                password: hashedPassword,
                role: 'ADMIN',
                isFirstLogin: false // Admin from ENV doesn't need force change
            },
        });

        this.logger.log(`✅ Admin account seeded: ${email}`);
    }
}
