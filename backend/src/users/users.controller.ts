import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles('ADMIN')
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Post('bulk-upload')
    @Roles('ADMIN')
    @UseInterceptors(FileInterceptor('file'))
    async bulkUpload(@UploadedFile() file: Express.Multer.File, @Body('role') role: Role) {
        return this.usersService.bulkUpload(file, role);
    }

    @Get()
    @Roles('ADMIN')
    findAll(@Query('role') role?: string) {
        return this.usersService.findAll(role);
    }

    @Get(':id')
    @Roles('ADMIN')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @Post('change-password')
    changePassword(@Req() req, @Body() changePasswordDto: ChangePasswordDto) {
        return this.usersService.changePassword(req.user.id, changePasswordDto);
    }
}
