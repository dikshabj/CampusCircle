import { Module } from '@nestjs/common';
import { TimetablesService } from './timetables.service';
import { TimetablesController } from './timetables.controller';

@Module({
    controllers: [TimetablesController],
    providers: [TimetablesService],
    exports: [TimetablesService],
})
export class TimetablesModule { }
