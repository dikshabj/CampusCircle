import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { MailService } from './mail.service';
import { RequestOtpDto, VerifyOtpDto, SetPasswordDto } from './dto/auth-flow.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    async findUserByIdentifier(identifier: string) {
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    { rollNumber: identifier },
                    { facultyId: identifier },
                    { email: identifier }
                ]
            }
        });
    }

    async requestOTP(dto: RequestOtpDto) {
        const user = await this.findUserByIdentifier(dto.identifier);
        if (!user) throw new NotFoundException('User not found');
        if (user.isActivated) throw new BadRequestException('Account is already activated');
        if (!user.email) throw new BadRequestException('User email not found. Please contact admin.');

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                otpHash,
                otpExpiresAt,
                otpAttempts: 0
            }
        });

        await this.mailService.sendOTP(user.email, otp);
        return { message: 'OTP sent successfully to registered email' };
    }

    async verifyOTP(dto: VerifyOtpDto) {
        const user = await this.findUserByIdentifier(dto.identifier);
        if (!user) throw new NotFoundException('User not found');
        if (user.isActivated) throw new BadRequestException('Account is already activated');

        if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            throw new BadRequestException('OTP expired or not requested');
        }

        if (user.otpAttempts >= 3) {
            throw new BadRequestException('Too many attempts. Please request a new OTP.');
        }

        const isMatch = await bcrypt.compare(dto.otp, user.otpHash);
        if (!isMatch) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { otpAttempts: { increment: 1 } }
            });
            throw new BadRequestException('Invalid OTP');
        }

        return { message: 'OTP verified successfully' };
    }

    async setInitialPassword(dto: SetPasswordDto) {
        const user = await this.findUserByIdentifier(dto.identifier);
        if (!user) throw new NotFoundException('User not found');
        if (user.isActivated) throw new BadRequestException('Account is already activated');

        // Note: In real app, we should probably check if OTP was verified in session or via a secret token
        // For simplicity, we assume frontend calls this after verifyOTP success.

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                isActivated: true,
                isFirstLogin: false,
                otpHash: null,
                otpExpiresAt: null,
                otpAttempts: 0
            }
        });

        return { message: 'Password set successfully. You can now login.' };
    }

    async login(loginDto: LoginDto) {
        const { identifier, password, loginType } = loginDto;
        console.log('--- Login Attempt ---', { identifier, loginType });

        let user;

        switch (loginType) {
            case 'student':
                user = await this.prisma.user.findFirst({
                    where: {
                        OR: [
                            { rollNumber: identifier },
                            { email: identifier }
                        ]
                    },
                    include: { batch: true },
                });
                break;
            case 'faculty':
                user = await this.prisma.user.findFirst({
                    where: {
                        OR: [
                            { facultyId: identifier },
                            { email: identifier }
                        ]
                    },
                });
                break;
            case 'admin':
                user = await this.prisma.user.findUnique({
                    where: { email: identifier },
                });
                break;
            default:
                throw new UnauthorizedException('Invalid login type');
        }

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify role matches login type
        const roleMap = { student: 'STUDENT', faculty: 'FACULTY', admin: 'ADMIN' };
        if (user.role !== roleMap[loginType]) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if activated (only for non-admin)
        if (user.role !== 'ADMIN' && !user.isActivated) {
            throw new UnauthorizedException('Account not activated. Please verify OTP first.');
        }

        const payload = {
            sub: user.id,
            role: user.role,
            name: user.name,
        };

        const token = this.jwtService.sign(payload);

        // Return user info without password
        const { password: _, ...userWithoutPassword } = user;

        return {
            access_token: token,
            user: userWithoutPassword,
        };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { batch: true },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async updateProfile(userId: string, data: any) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { ...data },
            include: { batch: true },
        });

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}
