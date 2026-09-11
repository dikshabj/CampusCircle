import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsDateString()
    @IsOptional()
    expiresAt?: string;

    @IsString()
    @IsOptional()
    batchId?: string; // If null, it's global

    @IsOptional()
    files?: any;

    @IsOptional()
    isAssignment?: boolean | string;

    @IsDateString()
    @IsOptional()
    deadline?: string;
}

export class UpdatePostDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    content?: string;

    @IsDateString()
    @IsOptional()
    expiresAt?: string;

    @IsString()
    @IsOptional()
    batchId?: string;

    @IsOptional()
    files?: any;

    @IsOptional()
    isAssignment?: boolean | string;

    @IsDateString()
    @IsOptional()
    deadline?: string;
}
