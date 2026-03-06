import { IsString, IsInt, IsArray, IsNotEmpty } from 'class-validator';

export class GenerateTimetableDto {
    @IsString()
    @IsNotEmpty()
    branch: string;

    @IsInt()
    @IsNotEmpty()
    semester: number;

    @IsString()
    @IsNotEmpty()
    section: string;

    @IsArray()
    @IsString({ each: true })
    subjects: string[];

    @IsInt()
    @IsNotEmpty()
    slotsPerDay: number;

    @IsString()
    @IsNotEmpty()
    startTime: string;

    @IsString()
    @IsNotEmpty()
    endTime: string;
}
