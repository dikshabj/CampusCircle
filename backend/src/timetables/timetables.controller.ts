import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TimetablesService } from './timetables.service';
import { CreateTimetableDto, UpdateTimetableDto } from './dto/timetable.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('timetables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetablesController {
    constructor(private readonly timetablesService: TimetablesService) { }

    @Post()
    @Roles('ADMIN')
    create(@Body() createTimetableDto: CreateTimetableDto) {
        return this.timetablesService.create(createTimetableDto);
    }

    @Post('bulk-import')
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    async bulkImport(@UploadedFile() file: Express.Multer.File) {
        return this.timetablesService.bulkImport(file);
    }

    @Post('bulk-import-link')
    @Roles('ADMIN')
    async bulkImportLink(@Body('url') url: string) {
        return this.timetablesService.bulkImportLink(url);
    }

    @Get()
    @Roles('ADMIN', 'FACULTY', 'STUDENT')
    findAll(@Query('batchId') batchId?: string) {
        return this.timetablesService.findAll(batchId);
    }

    @Get(':id')
    @Roles('ADMIN', 'FACULTY', 'STUDENT')
    findOne(@Param('id') id: string) {
        return this.timetablesService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() updateTimetableDto: UpdateTimetableDto) {
        return this.timetablesService.update(id, updateTimetableDto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.timetablesService.remove(id);
    }

    @Post('save-ai')
    @Roles('ADMIN')
    async saveAiTimetable(@Body() data: any) {
        console.log(`[TimetableController] POST /timetables/save-ai`);
        return this.timetablesService.saveAiTimetable(data);
    }

    @Post('generate/:batchId')
    @Roles('ADMIN')
    async generate(@Param('batchId') batchId: string) {
        return this.timetablesService.generateSmartTimeTable(batchId);
    }
}
