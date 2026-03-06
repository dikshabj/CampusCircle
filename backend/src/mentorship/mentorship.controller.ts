import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { MentorshipService } from './mentorship.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('mentorship')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MentorshipController {
    constructor(private mentorshipService: MentorshipService) { }

    @Get('batch')
    @Roles(Role.FACULTY)
    async getMyBatch(@Request() req) {
        return this.mentorshipService.getMentorBatchInfo(req.user.sub);
    }

    @Get('students')
    @Roles(Role.FACULTY)
    async getBatchStudents(@Request() req) {
        return this.mentorshipService.getBatchStudents(req.user.sub);
    }

    @Get('student/:id')
    @Roles(Role.FACULTY)
    async getStudentReport(@Request() req, @Param('id') studentId: string) {
        return this.mentorshipService.getStudentFullReport(req.user.sub, studentId);
    }
}
