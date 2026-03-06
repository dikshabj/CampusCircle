import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    identifier: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsIn(['student', 'faculty', 'admin'])
    loginType: string;
}
