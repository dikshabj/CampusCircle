import { Controller, Post, Body, Get, Patch, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RequestOtpDto, VerifyOtpDto, SetPasswordDto } from './dto/auth-flow.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('request-otp')
    async requestOTP(@Body() dto: RequestOtpDto) {
        return this.authService.requestOTP(dto);
    }

    @Post('verify-otp')
    async verifyOTP(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOTP(dto);
    }

    @Post('set-password')
    async setPassword(@Body() dto: SetPasswordDto) {
        return this.authService.setInitialPassword(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
        return this.authService.getProfile(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('profile')
    async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
        return this.authService.updateProfile(req.user.sub, updateProfileDto);
    }
}
