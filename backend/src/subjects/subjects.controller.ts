import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
    constructor(private readonly subjectsService: SubjectsService) { }

    @Post()
    @Roles('ADMIN')
    create(@Body() createSubjectDto: CreateSubjectDto) {
        return this.subjectsService.create(createSubjectDto);
    }

    @Get()
    @Roles('ADMIN', 'FACULTY', 'STUDENT')
    findAll(@Request() req, @Query('batchId') batchId?: string, @Query('facultyId') facultyId?: string) {
        // If role is faculty, restrict to their own subjects
        if (req.user.role === 'FACULTY') {
            return this.subjectsService.findAll(batchId, req.user.sub);
        }
        return this.subjectsService.findAll(batchId, facultyId);
    }

    @Get(':id')
    @Roles('ADMIN', 'FACULTY', 'STUDENT')
    findOne(@Param('id') id: string) {
        return this.subjectsService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
        return this.subjectsService.update(id, updateSubjectDto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.subjectsService.remove(id);
    }
}
