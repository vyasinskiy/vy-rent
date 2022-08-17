import { Controller, Get } from '@nestjs/common';
import { DataProviderService } from './data-provider.service';

@Controller()
export class AppController {
  constructor(private readonly dataProvider: DataProviderService) {}

  @Get()
  async test(): Promise<any> {
    const list = await this.dataProvider.getAppartmentList();
  }
}
