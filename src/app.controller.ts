import { Controller, Get } from '@nestjs/common';
import { ApiService } from './api.service';
import { writeFile } from 'fs/promises';
import { getCurrentPeriod } from './assets/helpers';

@Controller()
export class AppController {
  constructor(private readonly apiService: ApiService) {}

  @Get('/current-month-invoices')
  async getCurrentMonthInvoices(): Promise<any> {
    const appartmentList = await this.apiService.getAppartmentList();

    const accountsRequests = appartmentList.map((appartment) =>
      this.apiService.getAppartmentAccounts(appartment.id),
    );
    const accounts = (await Promise.all(accountsRequests)).flat();

    for await (const account of accounts) {
      try {
        const currentPeriod = Number(getCurrentPeriod());
        const { accountId, period, data } = await this.apiService.getInvoice(
          account.id,
          currentPeriod,
        );
        await writeFile(`${accountId}-${period}.pdf`, data);
      } catch {
        debugger;
      }
    }
  }
}
