import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ExamType } from '@prisma/client';

export class MarkRecordDto {
    @IsString()
    @IsNotEmpty()
    studentId: string;

    @IsNumber()
    @Min(0)
    @Max(100)
    marks: number;
}

export class CreateMarksDto {
    @IsString()
    @IsNotEmpty()
    subjectId: string;

    @IsEnum(ExamType)
    examType: ExamType;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MarkRecordDto)
    records: MarkRecordDto[];
}
