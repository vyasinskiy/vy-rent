import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountsService } from 'src/accounts/accounts.service';
import { AccrualsService } from 'src/accruals/accruals.service';
import { AppartmentsService } from 'src/appartments/appartments.service';
import { InvoiceService } from 'src/invoices/invoices.service';

interface InvoiceData {
  invoicePath: string;
  separatedPeriodCode: string;
  address: string;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly minSupportedPeriodCode = this.configService.get(
    'MIN_SUPPORTED_PERIOD_CODE',
  );

  constructor(
    private readonly configService: ConfigService,
    private readonly accountsService: AccountsService,
    private readonly appartmentsService: AppartmentsService,
    private readonly accrualsService: AccrualsService,
    private readonly invoiceService: InvoiceService,
  ) {}

  public async getAppartmentsList() {
    return await this.appartmentsService.getAppartmentsList();
  }

  public async getNewInvoices() {
    this.logger.log('Updating invoices...');

    const appartmentsList = await this.getAppartmentsList();

    const newInvoices: InvoiceData[] = [];

    for (const appartment of appartmentsList) {
      const accounts = await this.accountsService.getAccountsForAppartment(
        appartment._id,
      );

      for await (const account of accounts) {
        await this.accrualsService.updateAccrualsForAccount(account._id);
        const accountAccruals =
          await this.accrualsService.getAccrualsForAccount(account._id);

        for await (const accrual of accountAccruals) {
          if (accrual.periodId < this.minSupportedPeriodCode) {
            continue;
          }

          const isInvoiceDownloaded =
            await this.invoiceService.checkIsInvoiceDownloaded(
              accrual.appartmentId,
              accrual.accountId,
              accrual.periodId,
            );

          if (!isInvoiceDownloaded && accrual.invoiceExists) {
            this.logger.log(`Found new invoice for ${appartment.address}!`);
            const invoice = await this.invoiceService.fetchInvoiceForPeriod(
              accrual.accountId,
              accrual.periodId,
            );
            const { invoicePath, separatedPeriodCode } =
              await this.invoiceService.makeInvoicePath(
                accrual.appartmentId,
                accrual.accountId,
                accrual.periodId,
              );
            await this.invoiceService.saveInvoice(invoice, invoicePath);
            newInvoices.push({
              invoicePath,
              separatedPeriodCode,
              address: appartment.address,
            });
          }
        }
      }
    }

    this.logger.log('Invoices are updated!');
    return newInvoices;
  }

  public async updateAppartmentsList() {
    return await this.appartmentsService.updateAppartmentsList();
  }
  public async getAppartmentById(appartmentId: string) {
    return await this.appartmentsService.getAppartmentById(appartmentId);
  }

  public async getAccrualsForAppartment(appartmentId: string) {
    return await this.accrualsService.getAccrualsForAppartment(appartmentId);
  }

  public async getAccountsForAppartment(appartmentId: string) {
    return await this.accountsService.getAccountsForAppartment(appartmentId);
  }

  public async getInvoice(
    appartmentId: string,
    accountId: string,
    periodCode: string,
  ) {
    const isInvoiceDownloaded =
      await this.invoiceService.checkIsInvoiceDownloaded(
        appartmentId,
        accountId,
        periodCode,
      );

    if (!isInvoiceDownloaded) {
      await this.invoiceService.downloadInvoice(
        appartmentId,
        accountId,
        periodCode,
      );
    }

    return await this.invoiceService.makeInvoicePath(
      appartmentId,
      accountId,
      periodCode,
    );
  }
}
