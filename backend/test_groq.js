const OpenAI = require('openai'); require('dotenv').config(); 
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }); 

const dbSchema = `TABLE "User" (id text, name text, role text, batchId text); TABLE "Batch" (id text, branch text, semester int, section text); TABLE "Skill" (id text, name text); TABLE "StudentSkill" (id text, studentId text, skillId text, createdAt date); RELATIONSHIPS: - User.batchId = Batch.id - StudentSkill.studentId = User.id - StudentSkill.skillId = Skill.id`; 

const prompt = `You are a PostgreSQL expert. Based on the following database schema: ${dbSchema} Write a raw PostgreSQL query to answer this user question: "How many students are there?" CRITICAL: - Always use double quotes for table names like "User", "Skill", "StudentSkill", "Batch". - Return ONLY the raw SQL query. - Do not include markdown code blocks. - Do not include explanations.`; 

groq.chat.completions.create({ messages: [{ role: 'user', content: prompt }], model: 'openai/gpt-oss-20b' }).then(res => console.log(res.choices[0].message.content)).catch(e => console.error(e.message));
