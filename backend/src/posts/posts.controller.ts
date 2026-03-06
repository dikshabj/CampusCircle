import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Post()
    @Roles('ADMIN', 'FACULTY')
    @UseInterceptors(FilesInterceptor('files', 5))
    async create(@Body() createPostDto: CreatePostDto, @UploadedFiles() files: Array<Express.Multer.File>, @Request() req) {
        try {
            return await this.postsService.create(createPostDto, req.user.sub, files);
        } catch (error) {
            require('fs').appendFileSync('post-create-error.log', new Date().toISOString() + ': ' + (error as any).stack + '\n');
            throw error;
        }
    }

    @Get()
    findAll(@Query('batchId') batchId: string, @Request() req) {
        return this.postsService.findAll(req.user.role, batchId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.postsService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN', 'FACULTY')
    @UseInterceptors(FilesInterceptor('files', 5))
    update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto, @UploadedFiles() files: Array<Express.Multer.File>, @Request() req) {
        return this.postsService.update(id, updatePostDto, req.user.sub, req.user.role, files);
    }

    @Delete(':id')
    @Roles('ADMIN', 'FACULTY')
    remove(@Param('id') id: string, @Request() req) {
        return this.postsService.remove(id, req.user.sub, req.user.role);
    }

    @Post(':id/comments')
    createComment(@Param('id') id: string, @Body('content') content: string, @Request() req) {
        return this.postsService.createComment(id, req.user.sub, content);
    }
}
