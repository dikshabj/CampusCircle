import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  async summarizeSkills(@Body('question') question: string) {
    return await this.aiService.getAiSummary(question);
  }

    // ==============================================================
  // VECTOR DATABASE TEST ROUTE (PHASE 2)
  // ==============================================================
  

  @Post('embed-test')
  async testEmbedding(@Body() body: { text: string; type: string }) {
    if (!body.text) {
      return { error: "Text is required!" };
    }
    
    try {
      const result = await this.aiService.saveAiDocument(
        body.text, 
        { type: body.type || 'TEST_DATA' }
      );
      return result;
    } catch (e) {
      return { error: e.message, stack: e.stack };
    }
  }

    // ==============================================================
  // SEARCH & SYNC ROUTES (PHASE 3)
  // ==============================================================

  @Post('sync-students')
  async syncStudents() {
    return await this.aiService.syncAllStudentsToVectorDB();
  }

  @Post('search-students')
  async searchStudents(@Body('query') query: string) {
    if (!query) {
      return { error: "Query is required! Example: 'Find someone who knows React'" };
    }
    return await this.aiService.searchBestStudents(query);
  }

}
