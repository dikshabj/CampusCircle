import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './seed/seed.module';
import { BatchesModule } from './batches/batches.module';
import { UsersModule } from './users/users.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TimetablesModule } from './timetables/timetables.module';
import { PostsModule } from './posts/posts.module';
import { AttendanceModule } from './attendance/attendance.module';
import { MarksModule } from './marks/marks.module';
import { MentorshipModule } from './mentorship/mentorship.module';
import { DisputesModule } from './disputes/disputes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiModule } from './ai/ai.module';
import { AwsModule } from './aws/aws.module';

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    SeedModule,
    BatchesModule,
    UsersModule,
    SubjectsModule,
    TimetablesModule,
    PostsModule,
    AttendanceModule,
    MarksModule,
    MentorshipModule,
    DisputesModule,
    NotificationsModule,
    AiModule,
    AwsModule,
  ],
})
export class AppModule { }
