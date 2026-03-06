import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { Day } from '@prisma/client';

export class CreateTimetableDto {
    @IsEnum(Day)
    day: Day;

    @IsString()
    @IsNotEmpty()
    startTime: string; // e.g. "09:00"

    @IsString()
    @IsNotEmpty()
    endTime: string; // e.g. "10:00"

    @IsString()
    @IsNotEmpty()
    subjectId: string;

    @IsString()
    @IsNotEmpty()
    batchId: string;
}

export class UpdateTimetableDto {
    @IsEnum(Day)
    @IsNotEmpty()
    day?: Day;

    @IsString()
    @IsNotEmpty()
    startTime?: string;

    @IsString()
    @IsNotEmpty()
    endTime?: string;

    @IsString()
    @IsNotEmpty()
    subjectId?: string;
}
