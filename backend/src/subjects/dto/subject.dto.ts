import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';

export class CreateSubjectDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    batchId: string;

    @IsString()
    @IsOptional()
    facultyId?: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Max(10)
    priority?: number;

    @IsBoolean()
    @IsOptional()
    isDaily?: boolean;

    @IsInt()
    @IsOptional()
    weeklyTarget?: number;

    @IsBoolean()
    @IsOptional()
    isLab?: boolean;

    @IsString()
    @IsOptional()
    requiredLabName?: string;

    @IsInt()
    @IsOptional()
    labGroupCount?: number;
}

export class UpdateSubjectDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    facultyId?: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Max(10)
    priority?: number;

    @IsBoolean()
    @IsOptional()
    isDaily?: boolean;

    @IsInt()
    @IsOptional()
    weeklyTarget?: number;

    @IsBoolean()
    @IsOptional()
    isLab?: boolean;

    @IsString()
    @IsOptional()
    requiredLabName?: string;

    @IsInt()
    @IsOptional()
    labGroupCount?: number;
}

export class BulkUpdateSubjectDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    @Max(10)
    priority?: number;

    @IsString()
    @IsOptional()
    facultyId?: string;

    @IsBoolean()
    @IsOptional()
    isLab?: boolean;

    @IsInt()
    @IsOptional()
    weeklyTarget?: number;
}
