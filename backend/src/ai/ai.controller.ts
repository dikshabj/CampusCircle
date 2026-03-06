import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateTimetableDto } from './dto/generate-timetable.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    async chat(@Request() req, @Body('message') message: string) {
        console.log(`[AiController] POST /ai/chat - User: ${req.user.sub}, Msg: ${message}`);
        return this.aiService.getChatResponse(req.user.sub, message);
    }

    @Post('generate-timetable')
    async generateTimetable(@Body() dto: GenerateTimetableDto) {
        console.log(`[AiController] POST /ai/generate-timetable - Requesting for: ${dto.branch} Sem ${dto.semester}`);
        return this.aiService.generateTimetable(dto);
    }
}
