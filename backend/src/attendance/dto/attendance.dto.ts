import { IsString, IsNotEmpty, IsDateString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceRecordDto {
    @IsString()
    @IsNotEmpty()
    studentId: string;

    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;
}

export class CreateAttendanceDto {
    @IsString()
    @IsNotEmpty()
    subjectId: string;

    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttendanceRecordDto)
    records: AttendanceRecordDto[];
}

export class UpdateAttendanceRecordDto {
    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;
}
