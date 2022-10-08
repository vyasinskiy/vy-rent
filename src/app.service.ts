import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountsService } from './accounts/accounts.service';
import { AccrualsService } from './accruals/accruals.service';
import { AppartmentsService } from './appartments/appartments.service';
import { getCurrentPeriodCode } from './assets/helpers';
import { BotService } from './bot/bot.service';
import { InvoiceService } from './invoices/invoices.service';

@Injectable()
export class AppService {
  constructor(
    private readonly appartmentsService: AppartmentsService,
    private readonly accountsService: AccountsService,
    private readonly accrualsService: AccrualsService,
    private readonly botService: BotService,
    private readonly invoiceService: InvoiceService,
  ) {}

  async updateEntity(entity: string) {
    console.log(`Updating ${entity}...`);
    switch (entity) {
      case 'appartments':
        return await this.appartmentsService.updateAppartmentsList();
      case 'accounts':
        return await this.accountsService.updateAccounts();
      // TODO: continue with accruals
    }
  }

  async getLastMonthInvoices() {
    const lastMonthPeriodCode = getCurrentPeriodCode() - 1;
    return this.invoiceService.getInvoicesForPeriod(lastMonthPeriodCode);
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async updateInvoices(periodId = getCurrentPeriodCode() - 1) {
    console.log('Udating invoices...');
    const appartmentsList = await this.appartmentsService.getAppartmentsList();
    for (const appartment of appartmentsList) {
      const accounts = await this.accountsService.getAccountsForAppartment(
        appartment._id,
      );

      for await (const account of accounts) {
        await this.accrualsService.updateAccrualsForAccount(account._id);
        const accountAccruals =
          await this.accrualsService.getAccrualsForAccount(account._id);

        for await (const accrual of accountAccruals) {
          if (accrual.periodId < periodId) {
            continue;
          }

          const isInvoiceDownloaded =
            await this.invoiceService.checkIsInvoiceDownloaded(
              accrual.appartmentId,
              accrual.accountId,
              accrual.periodId,
            );

          if (!isInvoiceDownloaded && accrual.invoiceExists) {
            const invoice = await this.invoiceService.fetchInvoiceForPeriod(
              accrual.accountId,
              accrual.periodId,
            );
            const invoicePath = await this.invoiceService.makeInvoicePath(
              accrual.appartmentId,
              accrual.periodId,
              accrual.accountId,
            );
            await this.invoiceService.saveInvoice(invoice, invoicePath);
            await this.botService.sendInvoice(invoicePath, appartment.address);
          }
        }
      }
    }
    console.log('Invoices are updated!');
  }
}
