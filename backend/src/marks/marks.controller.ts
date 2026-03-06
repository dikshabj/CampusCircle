import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MarksService } from './marks.service';
import { CreateMarksDto } from './dto/mark.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, ExamType } from '@prisma/client';

@Controller('marks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarksController {
    constructor(private marksService: MarksService) { }

    // Bulk save marks (Faculty/Admin)
    @Post('save')
    @Roles(Role.FACULTY, Role.ADMIN)
    async save(@Body() dto: CreateMarksDto) {
        return this.marksService.saveMarks(dto);
    }

    @Post('bulk-upload')
    @Roles(Role.FACULTY, Role.ADMIN)
    @UseInterceptors(FileInterceptor('file'))
    async bulkUpload(
        @UploadedFile() file: Express.Multer.File,
        @Body('subjectId') subjectId: string,
        @Body('examType') examType: ExamType
    ) {
        return this.marksService.bulkUpload(file, subjectId, examType);
    }

    // Get marks for subject/exam (to edit)
    @Get('subject')
    @Roles(Role.FACULTY, Role.ADMIN)
    async getBySubject(@Query('subjectId') subjectId: string, @Query('examType') examType: ExamType) {
        return this.marksService.getMarks(subjectId, examType);
    }

    // Student portal: View results
    @Get('my-results')
    @Roles(Role.STUDENT)
    async getMyResults(@Request() req) {
        return this.marksService.getStudentMarks(req.user.sub);
    }

    // Admin/Faculty view results
    @Get('student/:id')
    @Roles(Role.FACULTY, Role.ADMIN)
    async getStudentResults(@Param('id') studentId: string) {
        return this.marksService.getStudentMarks(studentId);
    }
}
