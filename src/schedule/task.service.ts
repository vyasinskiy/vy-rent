import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppartmentsService } from 'src/appartments/appartments.service';

const at6amOn1dayOfEachMonth = '0 0 6 1 * *';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly appartmentService: AppartmentsService) {}

  @Cron(at6amOn1dayOfEachMonth)
  async updateAppartments() {
    this.logger.log('Updating appartments list...');
    await this.appartmentService.updateAppartmentsList();
  }
}
