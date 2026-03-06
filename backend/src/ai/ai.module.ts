import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AttendanceModule } from '../attendance/attendance.module';
import { TimetablesModule } from '../timetables/timetables.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { PostsModule } from '../posts/posts.module';
import { DisputesModule } from '../disputes/disputes.module';

@Module({
    imports: [AttendanceModule, TimetablesModule, SubjectsModule, PostsModule, DisputesModule],
    controllers: [AiController],
    providers: [AiService],
})
export class AiModule { }
