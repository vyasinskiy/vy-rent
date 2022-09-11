import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountsService } from './accounts/accounts.service';
import { AccrualsService } from './accruals/accruals.service';
import { AppartmentsService } from './appartments/appartments.service';
import { getCurrentPeriodCode } from './assets/helpers';
import { InvoiceService } from './invoices/invoices.service';

@Injectable()
export class AppService {
  constructor(
    private readonly appartmentsService: AppartmentsService,
    private readonly accountsService: AccountsService,
    private readonly accrualsService: AccrualsService,
    private readonly invoiceService: InvoiceService,
  ) {}

  async getLastMonthInvoices() {
    const currentPeriodCode = getCurrentPeriodCode();
    return this.invoiceService.getInvoicesForPeriod(currentPeriodCode);
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async updateInvoices(periodId = 202206) {
    console.log('Auto updating invoices...');
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
          }
        }
      }
    }
    console.log('Invoices are updated!');
  }
}
