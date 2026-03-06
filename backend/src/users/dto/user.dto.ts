import { IsString, IsEmail, IsEnum, IsOptional, IsNotEmpty, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsEnum(Role)
    role: Role;

    @IsString()
    @IsOptional()
    rollNumber?: string;

    @IsString()
    @IsOptional()
    facultyId?: string;

    @IsString()
    @IsOptional()
    batchId?: string;
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;

    @IsString()
    @IsOptional()
    batchId?: string;

    @IsOptional()
    isMentor?: boolean;

    @IsString()
    @IsOptional()
    mentorBatchId?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    bio?: string;
}

export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}
