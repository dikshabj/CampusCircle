import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
}
