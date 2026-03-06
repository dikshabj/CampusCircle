import { IsString, IsInt, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateBatchDto {
    @IsString()
    @IsNotEmpty()
    branch: string;

    @IsInt()
    @Min(1)
    @Max(8)
    semester: number;

    @IsString()
    @IsNotEmpty()
    section: string;
}

export class UpdateBatchDto {
    @IsString()
    @IsNotEmpty()
    branch?: string;

    @IsInt()
    @Min(1)
    @Max(8)
    semester?: number;

    @IsString()
    @IsNotEmpty()
    section?: string;
}
