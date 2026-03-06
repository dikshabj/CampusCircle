import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AwsModule } from '../aws/aws.module';

@Module({
    imports: [NotificationsModule, AwsModule],
    controllers: [PostsController],
    providers: [PostsService],
    exports: [PostsService],
})
export class PostsModule { }
