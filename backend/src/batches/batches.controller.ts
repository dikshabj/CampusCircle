import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto, UpdateBatchDto } from './dto/batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('batches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BatchesController {
    constructor(private readonly batchesService: BatchesService) { }

    @Post()
    @Roles('ADMIN')
    create(@Body() createBatchDto: CreateBatchDto) {
        return this.batchesService.create(createBatchDto);
    }

    @Get()
    @Roles('ADMIN', 'FACULTY')
    findAll() {
        return this.batchesService.findAll();
    }

    @Get(':id')
    @Roles('ADMIN', 'FACULTY')
    findOne(@Param('id') id: string) {
        return this.batchesService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() updateBatchDto: UpdateBatchDto) {
        return this.batchesService.update(id, updateBatchDto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.batchesService.remove(id);
    }
}
