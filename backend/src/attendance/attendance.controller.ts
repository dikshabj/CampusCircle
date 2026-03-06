import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
    constructor(private attendanceService: AttendanceService) { }

    // Faculty/Admin can list students for a subject
    @Get('students/:subjectId')
    @Roles(Role.FACULTY, Role.ADMIN)
    async getStudents(@Param('subjectId') subjectId: string) {
        return this.attendanceService.getStudentsForSubject(subjectId);
    }

    // Mark/Edit Attendance
    @Post('mark')
    @Roles(Role.FACULTY, Role.ADMIN)
    async mark(@Request() req, @Body() dto: CreateAttendanceDto) {
        return this.attendanceService.markAttendance(req.user.sub, dto);
    }

    // Get session status for a specific day
    @Get('session')
    @Roles(Role.FACULTY, Role.ADMIN)
    async getSession(@Query('subjectId') subjectId: string, @Query('date') date: string) {
        const session = await this.attendanceService.getSession(subjectId, date);
        if (!session) return { message: 'No session found for this date', records: [] };
        return session;
    }

    // Student portal: My Attendance
    @Get('my-attendance')
    @Roles(Role.STUDENT)
    async getMyAttendance(@Request() req) {
        return this.attendanceService.getStudentAttendance(req.user.sub);
    }

    @Get('my-logs')
    @Roles(Role.STUDENT)
    async getMyLogs(@Request() req) {
        return this.attendanceService.getStudentDetailedLogs(req.user.sub);
    }

    // Admin/Faculty view attendance for any student
    @Get('student/:studentId')
    @Roles(Role.FACULTY, Role.ADMIN)
    async getStudentAttendance(@Param('studentId') studentId: string) {
        return this.attendanceService.getStudentAttendance(studentId);
    }
}
