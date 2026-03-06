import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RequestOtpDto {
    @IsString()
    @IsNotEmpty()
    identifier: string; // rollNumber or facultyId or email
}

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty()
    identifier: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    otp: string;
}

export class SetPasswordDto {
    @IsString()
    @IsNotEmpty()
    identifier: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}
