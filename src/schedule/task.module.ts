import { Module } from '@nestjs/common';
import { AppartmentsModule } from 'src/appartments/appartments.module';
import { TaskService } from './task.service';

@Module({
  imports: [AppartmentsModule],
  providers: [TaskService],
})
export class TasksModule {}
