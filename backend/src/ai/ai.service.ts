import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai'; // Groq is compatible with the OpenAI SDK

@Injectable()
export class AiService {
  private prisma = new PrismaClient();
  private groq: OpenAI;

  constructor() {
    // Initialize Groq Client
    this.groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY || '',
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  private readonly dbSchema = `
    TABLE "User" (id text, name text, role text, batchId text);
    TABLE "Batch" (id text, branch text, semester int, section text);
    TABLE "Skill" (id text, name text);
    TABLE "StudentSkill" (id text, studentId text, skillId text, createdAt date);

    RELATIONSHIPS:
    - User.batchId = Batch.id
    - StudentSkill.studentId = User.id
    - StudentSkill.skillId = Skill.id
  `;

  async getAiSummary(question: string) {
    let sqlQuery = '';
    let rawData: any = null;
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = '';

    // Auto-Retry Loop: If AI generates bad SQL, it tells AI the error and asks it to fix it!
    while (attempts < maxAttempts) {
      try {
        sqlQuery = await this.generateSqlFromGroq(question, lastError);
        this.validateSql(sqlQuery);
        rawData = await this.prisma.$queryRawUnsafe(sqlQuery);
        break; // Success! Break out of the loop
      } catch (error) {
        attempts++;
        lastError = error.message;
        console.warn(`[AI Warning] SQL Attempt ${attempts} failed:`, lastError);
        if (attempts >= maxAttempts) {
          throw new BadRequestException(`AI query failed after 3 attempts. Last Error: ${lastError}`);
        }
      }
    }

    try {
      const finalSummary = await this.summarizeDataWithGroq(question, rawData);
      
      // Fix Prisma BigInt serialization issue (Express cannot JSON.stringify BigInts)
      const serializedRawData = JSON.parse(
        JSON.stringify(rawData, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      );

      return { answer: finalSummary, sql: sqlQuery, rawData: serializedRawData };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('AI Summarization Failed: ' + error.message);
    }
  }

  private async generateSqlFromGroq(question: string, previousError: string = ''): Promise<string> {
    let prompt = `
      You are a PostgreSQL expert.
      Based on the following database schema:
      ${this.dbSchema}
      Write a raw PostgreSQL query to answer this user question:
      "${question}"
      CRITICAL:
      - Always use double quotes for BOTH table names AND column names.
      - Example: "User"."batchId", "StudentSkill"."skillId", "StudentSkill"."studentId"
      - ALWAYS use 'ILIKE' instead of '=' for string comparisons to make it case-insensitive. (e.g. WHERE "Skill"."name" ILIKE '%react%')
      - ALWAYS use DISTINCT when counting users or listing names to avoid duplicate records (e.g. SELECT COUNT(DISTINCT "User".id)... or SELECT DISTINCT "User".name...).
      - You MUST wrap the SQL query inside a markdown code block like this: \`\`\`sql [query] \`\`\`
      - Do not include any explanations before or after the code block.
    `;

    if (previousError) {
      prompt += `\n\nWARNING: Your previous SQL query failed with this error: "${previousError}". \nPlease fix the error and write the corrected SQL query.`;
    }

    const chatCompletion = await this.groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    });

    let sql = chatCompletion.choices[0]?.message?.content?.trim() || '';
    
    // Extract SQL from markdown blocks
    const sqlMatch = sql.match(/```(?:sql)?([\s\S]*?)```/i);
    if (sqlMatch) {
      sql = sqlMatch[1].trim();
    } else {
      // Fallback: remove conversational text if they ignore the rule
      const selectIndex = sql.toUpperCase().indexOf('SELECT');
      const lastSemicolon = sql.lastIndexOf(';');
      if (selectIndex !== -1) {
        sql = sql.substring(selectIndex, lastSemicolon !== -1 ? lastSemicolon + 1 : undefined);
      }
    }
    
    return sql;
  }

  private validateSql(sql: string) {
    const dangerousKeywords = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'EXEC', 'GRANT', 'REVOKE',
    ];
    const upperSql = sql.toUpperCase();
    for (const keyword of dangerousKeywords) {
      if (upperSql.includes(keyword)) {
        throw new Error(`Unsafe SQL query blocked. Contains forbidden keyword: ${keyword}`);
      }
    }
    if (!upperSql.startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed for safety.');
    }
  }

  private async summarizeDataWithGroq(question: string, data: any): Promise<string> {
    const prompt = `
      The user asked:
      "${question}"
      The database returned this JSON data:
      ${JSON.stringify(data, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )}
      Please summarize this data in a professional, natural language response.
      Answer the user's question directly.
    `;

    const chatCompletion = await this.groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    });

    return chatCompletion.choices[0]?.message?.content?.trim() || '';
  }

  // ==============================================================
  // VECTOR DATABASE & EMBEDDINGS (PHASE 2)
  // ==============================================================

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Lazy load transformers pipeline to avoid blocking server startup
      const { pipeline } = await import('@xenova/transformers');
      const generate = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
      const output = await generate(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.error(error);
      throw new Error('Local Embedding generation failed: ' + error.message);
    }
  }

  async saveAiDocument(content: string, metadata: any) {
    const embedding = await this.generateEmbedding(content);
    const vectorString = `[${embedding.join(',')}]`;

    await this.prisma.$executeRawUnsafe(`
      INSERT INTO "AiDocument" (id, content, metadata, embedding)
      VALUES (gen_random_uuid(), $1, $2::jsonb, $3::vector)
    `, content, JSON.stringify(metadata), vectorString);

    return { success: true, message: "Data vectorized and saved successfully!" };
  }


    // ==============================================================
  // BATCH SYNC & SEMANTIC SEARCH (PHASE 3)
  // ==============================================================

  // Step 3: Database ke sabhi students ko Vector DB mein daalna
  async syncAllStudentsToVectorDB() {
    // 1. Saare students aur unki details (Batch & Skills) uthao
    const students = await this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        batch: true,
        skills: {
          include: { skill: true }
        }
      }
    });

    let syncedCount = 0;

    for (const student of students) {
      // 2. Skills ko ek sentence mein join karna
      const skillNames = student.skills.map(s => s.skill.name).join(', ');
      const batchInfo = student.batch ? `${student.batch.branch} Semester ${student.batch.semester}` : '';
      
      // 3. AI ke padhne ke liye ek sentence banana
      const profileText = `Student ${student.name} from ${batchInfo}. Skills: ${skillNames || 'No specific skills'}.`;

      // 4. Vectorize karke save karna
      await this.saveAiDocument(profileText, { 
        type: 'STUDENT_PROFILE', 
        studentId: student.id,
        name: student.name
      });
      syncedCount++;
    }

    return { success: true, message: `${syncedCount} students successfully vectorized!` };
  }

  // Step 4: User ke question se best students dhundhna
  async searchBestStudents(question: string, limit: number = 3) {
    // 1. User ke Question ko numbers (Vector) me convert karo
    const questionVector = await this.generateEmbedding(question);
    const vectorString = `[${questionVector.join(',')}]`;

    // 2. pgvector ki Math (<=> Cosine Distance) use karke database se sabse similar profile lao
    const results = await this.prisma.$queryRawUnsafe(`
      SELECT 
        metadata, 
        content,
        1 - (embedding <=> $1::vector) as similarity
      FROM "AiDocument"
      WHERE metadata->>'type' = 'STUDENT_PROFILE'
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `, vectorString, limit);

    return results;
  }

}
