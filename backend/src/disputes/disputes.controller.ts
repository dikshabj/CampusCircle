import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, DisputeStatus } from '@prisma/client';

@Controller('disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisputesController {
    constructor(private disputesService: DisputesService) { }

    @Post()
    @Roles(Role.STUDENT)
    async create(@Request() req, @Body('recordId') recordId: string, @Body('reason') reason: string) {
        return this.disputesService.create(req.user.sub, recordId, reason);
    }

    @Get('student')
    @Roles(Role.STUDENT)
    async getStudentDisputes(@Request() req) {
        return this.disputesService.getStudentDisputes(req.user.sub);
    }

    @Get('faculty')
    @Roles(Role.FACULTY)
    async getFacultyDisputes(@Request() req) {
        return this.disputesService.getFacultyDisputes(req.user.sub);
    }

    @Patch(':id/resolve')
    @Roles(Role.FACULTY)
    async resolve(@Request() req, @Param('id') id: string, @Body('status') status: DisputeStatus) {
        return this.disputesService.resolveDispute(req.user.sub, id, status);
    }
}
