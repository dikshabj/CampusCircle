import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { TimetablesService } from '../timetables/timetables.service';
import { PostsService } from '../posts/posts.service';
import { DisputesService } from '../disputes/disputes.service';
import Groq from 'groq-sdk';

@Injectable()
export class AiService {
    private groq: Groq | null = null;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
        private attendanceService: AttendanceService,
        private timetablesService: TimetablesService,
        private postsService: PostsService,
        private disputesService: DisputesService,
    ) {
        const groqKey = this.configService.get<string>('GROQ_API_KEY');
        if (groqKey) {
            this.groq = new Groq({ apiKey: groqKey });
        }
    }

    // ==========================================
    // RULE-BASED FALLBACK (No API needed!)
    // ==========================================
    // This handles common queries using keywords
    // and returns data directly from the database.
    // Works even when Groq API is down or quota is over.
    // ==========================================
    private handleWithRules(message: string, context: {
        studentName: string;
        attendance: any[];
        timetable: any[];
        posts: any[];
        disputes: any[];
        rollNumber: string;
    }): string | null {
        const msg = message.toLowerCase().trim();

        // --- Attendance Queries ---
        if (msg.includes('attendance') || msg.includes('absent') || msg.includes('present')) {
            if (!context.attendance || context.attendance.length === 0) {
                return `📊 No attendance records found yet, ${context.studentName}. Your teachers will start marking soon!`;
            }

            let response = `📊 Attendance Summary for ${context.studentName}:\n\n`;
            let totalPresent = 0, totalClasses = 0;

            context.attendance.forEach((sub: any) => {
                const subName = sub.name || sub.subjectName || sub.subject?.name || 'Unknown Subject';
                const pct = sub.total > 0 ? Math.round((sub.present / sub.total) * 100) : 0;
                const emoji = pct >= 75 ? '✅' : '⚠️';
                response += `${emoji} ${subName}: ${sub.present}/${sub.total} (${pct}%)\n`;
                totalPresent += sub.present;
                totalClasses += sub.total;

                if (pct < 75 && sub.total > 0) {
                    const needed = Math.ceil((0.75 * sub.total - sub.present) / 0.25);
                    response += `   → Need ${needed} more classes to reach 75%\n`;
                }
            });

            const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
            response += `\n📈 Overall: ${overallPct}% (${totalPresent}/${totalClasses})`;

            if (overallPct < 75) {
                response += `\n\n🚨 Shortage Warning! Your overall attendance is below 75%. Attend more classes!`;
            }

            return response;
        }

        // --- Timetable Queries ---
        if (msg.includes('timetable') || msg.includes('schedule') || msg.includes('class') || msg.includes('next class') || msg.includes('today')) {
            if (!context.timetable || context.timetable.length === 0) {
                return `📅 No timetable found yet. Your admin will upload it soon!`;
            }

            const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
            const today = days[new Date().getDay()];

            // Find today's classes
            const todayClasses = context.timetable.filter(
                (t: any) => t.day?.toUpperCase() === today
            );

            if (todayClasses.length === 0) {
                return `📅 No classes scheduled for today (${today}). Enjoy your day off! 🎉`;
            }

            let response = `📅 Today's Schedule (${today}):\n\n`;
            const sorted = todayClasses.sort((a: any, b: any) => {
                const timeA = a.startTime || a.time || '';
                const timeB = b.startTime || b.time || '';
                return timeA.localeCompare(timeB);
            });

            sorted.forEach((cls: any) => {
                const className = cls.subject?.name || cls.subjectName || cls.name || 'Class';
                response += `📚 ${className}\n`;
                response += `   🕐 ${cls.startTime || cls.time || 'TBD'} - ${cls.endTime || ''}\n`;
                if (cls.room || cls.location) response += `   📍 ${cls.room || cls.location}\n`;
                if (cls.faculty?.name || cls.teacherName) response += `   👨‍🏫 ${cls.faculty?.name || cls.teacherName}\n`;
                response += `\n`;
            });

            return response;
        }

        // --- Subject Queries ---
        if (msg.includes('subject') || msg.includes('course')) {
            if (!context.attendance || context.attendance.length === 0) {
                return `📚 No subjects found yet. They'll appear once your batch is set up!`;
            }
            let response = `📚 Your Subjects:\n\n`;
            context.attendance.forEach((sub: any, i: number) => {
                const subName = sub.name || sub.subjectName || sub.subject?.name || 'Unknown Subject';
                response += `${i + 1}. ${subName}${sub.code ? ` (${sub.code})` : ''}\n`;
            });
            return response;
        }

        // --- Announcement Queries ---
        if (msg.includes('announcement') || msg.includes('notice') || msg.includes('news') || msg.includes('update')) {
            if (!context.posts || context.posts.length === 0) {
                return `📢 No recent announcements for your batch, ${context.studentName}. Stay tuned!`;
            }

            let response = `📢 Recent Announcements:\n\n`;
            context.posts.slice(0, 3).forEach((post: any, i: number) => {
                response += `${i + 1}. ${post.title}\n`;
                if (post.content) response += `   📝 ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}\n`;
                response += `   🗓️ ${new Date(post.createdAt).toLocaleDateString()}\n\n`;
            });
            return response;
        }

        // --- Dispute Queries ---
        if (msg.includes('dispute') || msg.includes('resolution') || msg.includes('resolved')) {
            if (!context.disputes || context.disputes.length === 0) {
                return `🤷 No attendance disputes found for you, ${context.studentName}.`;
            }

            let response = `📑 Your Attendance Disputes:\n\n`;
            context.disputes.forEach((d: any, i: number) => {
                const date = new Date(d.record?.session?.date).toLocaleDateString();
                const subject = d.record?.session?.subject?.name || 'Unknown Subject';
                const statusEmoji = d.status === 'APPROVED' ? '✅' : d.status === 'REJECTED' ? '❌' : '⏳';

                response += `${i + 1}. ${subject} (${date})\n`;
                response += `   Status: ${statusEmoji} ${d.status}\n`;
                if (d.reason) response += `   Reason: ${d.reason}\n`;
                response += `\n`;
            });
            return response;
        }

        // --- Greeting ---
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg === 'help') {
            return `👋 Hi ${context.studentName}! I'm your Campus AI Assistant. You can ask me about:\n\n` +
                `📊 **Attendance** - "How's my attendance?"\n` +
                `📅 **Timetable** - "What classes today?"\n` +
                `📢 **Announcements** - "Any new notices?"\n` +
                `📑 **Disputes** - "Status of my disputes?"\n` +
                `📚 **Subjects** - "List my subjects"\n\n` +
                `Just type your question!`;
        }

        // No rule matched — return null so Groq API handles it
        return null;
    }

    // ==========================================
    // MAIN CHAT HANDLER
    // Strategy: Try rule-based first → then Groq API → then error
    // ==========================================
    async getChatResponse(studentId: string, message: string) {
        console.log(`[AI] Chat Request - StudentId: ${studentId}, Message: "${message}"`);
        let student, attendance, timetable, posts, disputes;

        try {
            // 1. Get student profile & context
            student = await this.prisma.user.findUnique({
                where: { id: studentId },
                select: { name: true, batchId: true, rollNumber: true }
            });

            if (!student) {
                console.error(`[AI] Error: Student with ID ${studentId} not found in database.`);
                return { message: "User profile not found. Please log in again.", status: 'error' };
            }
            console.log(`[AI] Found student: ${student.name}`);
        } catch (dbErr) {
            console.error('[AI] DB Error (User):', dbErr);
            return { message: "Error fetching user profile.", status: 'error' };
        }

        try {
            // 2. Get ERP data
            attendance = await this.attendanceService.getStudentAttendance(studentId);
            timetable = await this.timetablesService.findAll(student.batchId ?? undefined);

            // Fetch student role for posts (assuming they are student as per prompt)
            posts = await this.postsService.findAll('STUDENT', student.batchId || undefined);

            // Fetch student disputes
            disputes = await this.disputesService.getStudentDisputes(studentId);

            console.log(`[AI] Data fetched - Attendance: ${attendance?.length}, Timetable: ${timetable?.length}, Posts: ${posts?.length}, Disputes: ${disputes?.length}`);
        } catch (erpErr) {
            console.error('[AI] ERP Data Error:', erpErr);
            // Non-blocking but good to know
        }

        try {
            // 3. Try rule-based fallback FIRST (instant, no API needed)
            const ruleResponse = this.handleWithRules(message, {
                studentName: student.name,
                attendance: attendance || [],
                timetable: timetable || [],
                posts: posts || [],
                disputes: disputes || [],
                rollNumber: student.rollNumber || '',
            });

            if (ruleResponse) {
                console.log(`[AI] Rule match found - skipping API call.`);
                return { message: ruleResponse, status: 'success' };
            }
        } catch (ruleErr) {
            console.error('[AI] Rule Handler Error:', ruleErr);
        }

        try {
            // 4. If no rule matched, use Groq API for complex/general queries
            if (!this.groq) {
                console.log(`[AI] Groq not initialized - using basic fallback.`);
                return {
                    message: "I can help with attendance, timetable, and subjects! Try asking about those. 😊",
                    status: 'success'
                };
            }

            console.log(`[AI] Calling Groq API...`);

            // Compact data to avoid TPM limits (6000 tokens is small)
            const attendanceSummary = (attendance || []).map((a: any) =>
                `${a.name || 'Subject'}: ${a.present}/${a.total} (${a.total > 0 ? Math.round((a.present / a.total) * 100) : 0}%)`
            ).join(', ');

            const timetableSummary = (timetable || []).map((t: any) =>
                `${t.day}: ${t.subject?.name || t.subjectName} (${t.startTime}-${t.endTime})`
            ).join(', ');

            const postSummary = (posts || []).slice(0, 3).map((p: any) =>
                `${p.title}: ${p.content?.substring(0, 50)}...`
            ).join(' | ');

            const disputeSummary = (disputes || []).slice(0, 5).map((d: any) =>
                `${d.record?.session?.subject?.name || 'Class'} (${d.status})`
            ).join(', ');

            const systemPrompt = `
You are "Campus AI Assistant" for student: ${student.name}.
Role: Answer academic queries in a friendly tone with emojis.

Data Context:
- Roll: ${student.rollNumber || 'N/A'}
- Attendance: ${attendanceSummary || 'None'}
- Timetable: ${timetableSummary || 'None'}
- Announcements: ${postSummary || 'No recent announcements'}
- Disputes: ${disputeSummary || 'No attendance disputes found'}

Rules:
1. ONLY answer based on the data provided.
2. If asked for announcements or disputes, use the data in context.
3. Keep it brief. Use bullet points for lists.
4. If attendance < 75% in a subject, warn them.
`;

            const chatCompletion = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                model: this.configService.get<string>('GROQ_MODEL') || 'llama-3.1-8b-instant',
                max_tokens: 250,
                temperature: 0.6,
            });

            const text = chatCompletion.choices[0]?.message?.content || 'Sorry, no response generated.';
            console.log(`[AI] Groq Success: ${text.substring(0, 50)}...`);
            return { message: text, status: 'success' };

        } catch (err) {
            console.error('[AI] Groq API / System Error:', err);
            const isRateLimit = err?.status === 429 || err?.message?.includes('429');
            return {
                message: isRateLimit
                    ? "⏳ API rate limit reached. Please wait a moment and try again!"
                    : "Sorry, I hit a snag while processing that. Please try again later.",
                status: 'error'
            };
        }
    }

    // ==========================================
    // AI TIMETABLE GENERATOR
    // ==========================================

    async generateTimetable(data: {
        branch: string,
        semester: number,
        section: string,
        subjects: string[],
        slotsPerDay: number,
        startTime: string,
        endTime: string
    }) {
        console.log(`[AI] Generating timetable for ${data.branch} Sem ${data.semester} Section ${data.section}`);

        const prompt = this.buildTimetablePrompt(data);
        console.log(`[AI] Prompt Built. Calling API...`);

        const responseText = await this.callGrokAPI(prompt);

        try {
            // Extract JSON from response (handling potential markdown blocks)
            let jsonStr = responseText.trim();
            if (jsonStr.includes('```json')) {
                jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
            } else if (jsonStr.includes('```')) {
                jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
            }

            const timetable = JSON.parse(jsonStr);
            console.log(`[AI] Successfully parsed ${timetable.length} slots.`);

            // Basic validation
            this.validateTimetableResponse(timetable, data.subjects);

            return {
                batch: { branch: data.branch, semester: data.semester, section: data.section },
                slots: timetable,
                status: 'success'
            };
        } catch (err) {
            console.error('[AI] Parsing/Validation Error:', err);
            throw new Error(`AI generated invalid output: ${err.message}`);
        }
    }

    private buildTimetablePrompt(data: any): string {
        return `
You are a university academic scheduler. 

GOAL: Generate a weekly timetable for:
- Branch: ${data.branch}
- Semester: ${data.semester}
- Section: ${data.section}
- Subjects: ${data.subjects.join(', ')}

RULES:
1. Days: Monday to Friday.
2. Slots per day: ${data.slotsPerDay}.
3. Time range: ${data.startTime} to ${data.endTime}.
4. Duration: All slots should be equal (e.g., if ${data.slotsPerDay} slots between 9 and 1 and they are 1hr each).
5. No gap between classes.
6. Do NOT repeat the same subject twice in a row.
7. Distribute subjects evenly across the week.

OUTPUT FORMAT:
Return ONLY a JSON array. No explanations. No other text.

FORMAT EXAMPLE:
[
  { "day": "MONDAY", "startTime": "09:00", "endTime": "10:00", "subject": "DBMS" },
  { "day": "MONDAY", "startTime": "10:00", "endTime": "11:00", "subject": "OS" }
]

Ensure all fields are present for every slot.
Daily slots must be ${data.slotsPerDay}.
Total slots should be ${5 * data.slotsPerDay}.
`;
    }

    private async callGrokAPI(prompt: string): Promise<string> {
        if (!this.groq) {
            throw new Error("AI (Groq) is not configured correctly on the server.");
        }

        const chatCompletion = await this.groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'Format: JSON array only.' },
                { role: 'user', content: prompt }
            ],
            model: this.configService.get<string>('GROQ_MODEL') || 'llama-3.1-8b-instant',
            max_tokens: 2000,
            temperature: 0.3,
        });

        return chatCompletion.choices[0]?.message?.content || '[]';
    }

    private validateTimetableResponse(slots: any[], subjects: string[]) {
        if (!Array.isArray(slots)) throw new Error('AI response is not an array.');
        if (slots.length === 0) throw new Error('AI returned an empty timetable.');

        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

        slots.forEach((slot, i) => {
            if (!slot.day || !slot.startTime || !slot.endTime || !slot.subject) {
                throw new Error(`Slot ${i} is missing required fields.`);
            }
            if (!days.includes(slot.day.toUpperCase())) {
                throw new Error(`Invalid day "${slot.day}" in slot ${i}.`);
            }
        });
    }
}
