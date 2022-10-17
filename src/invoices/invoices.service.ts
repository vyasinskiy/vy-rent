import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import * as fs from 'fs';
import { writeFile } from 'fs/promises';
import { ApiService } from 'src/api/api.service';
import { AppartmentsService } from 'src/appartments/appartments.service';
import { AccountsService } from '../accounts/accounts.service';

const INVOICE_DATA_REGEXP =
  /(?<shortOrganizationName>.*)_(?<separatedPeriod>\/d{4}-\/d{2})_(?<appartmentId>\/d{6})_(?<accountId>\/d{6})/;

enum InvoiceDataKeys {
  ShortOrganizationName = 'shortOrganizationName',
  SeparatedPeriod = 'separatedPeriod',
  AppartmentId = 'appartmentId',
  AccountId = 'accountId',
}
@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly apiService: ApiService,
    private readonly accountsService: AccountsService,
    private readonly appartmentsService: AppartmentsService,
  ) {}

  public async checkIsInvoiceDownloaded(appartmentId, accountId, periodCode) {
    const invoicesDirPath = this.getDirectoryForPeriod(
      appartmentId,
      periodCode,
    );
    const existedInvoices = fs.readdirSync(invoicesDirPath);
    const { invoiceName } = await this.makeInvoiceName(
      appartmentId,
      accountId,
      periodCode,
    );
    return existedInvoices.includes(invoiceName);
  }

  async getInvoicesForPeriod(periodCode: number) {
    const appartmentsList = await this.appartmentsService.getAppartmentsList();
    const invoices: StreamableFile[] = [];
    for await (const appartment of appartmentsList) {
      const dir = this.getDirectoryForPeriod(appartment._id, periodCode);
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const pdf = fs.createReadStream(`${dir}/${file}`);
        invoices.push(new StreamableFile(pdf));
      }
    }

    return invoices;
  }

  public async updateInvoicesForPeriod(
    appartmentId: number,
    periodCode: number,
  ) {
    const invoicesDirPath = this.getDirectoryForPeriod(
      appartmentId,
      periodCode,
    );
    const existedInvoices = fs.readdirSync(invoicesDirPath);

    const appartmentAccounts =
      await this.accountsService.getAccountsForAppartment(appartmentId);
    const accountsToIgnore = existedInvoices.map((invoicePath) =>
      this.getDataKeyFromInvoiceName(invoicePath, InvoiceDataKeys.AccountId),
    );
    const accountsToFetch = appartmentAccounts.filter(
      (account) => !accountsToIgnore.includes(account._id),
    );
    for await (const account of accountsToFetch) {
      await this.downloadInvoice(appartmentId, account._id, periodCode);
    }
    this.logger.log(
      `Invoices for period ${periodCode} for appartment ${appartmentId} has been updated!`,
    );
  }

  public async fetchInvoiceForPeriod(accountId, periodCode) {
    this.logger.log(
      `Fetching invoice for account ${accountId} for period ${periodCode}...`,
    );
    const { data } = await this.apiService.getInvoice(accountId, periodCode);

    return data;
  }

  public async downloadInvoice(appartmentId, accountId, periodCode) {
    const invoice = await this.fetchInvoiceForPeriod(accountId, periodCode);
    const { invoicePath } = await this.makeInvoicePath(
      appartmentId,
      accountId,
      periodCode,
    );
    await this.saveInvoice(invoice, invoicePath);
  }

  public async saveInvoice(invoice, invoicePath) {
    // TODO: how to use fs.writeFileSync(invoicePath, invoice)?
    await writeFile(invoicePath, invoice);
  }

  public async makeInvoicePath(appartmentId, accountId, periodCode) {
    const invoiceDir = this.getDirectoryForPeriod(appartmentId, periodCode);
    const {
      invoiceName,
      organizationName,
      cleanOrganizationName,
      separatedPeriodCode,
    } = await this.makeInvoiceName(appartmentId, accountId, periodCode);
    const invoicePath = `${invoiceDir}/${invoiceName}`;
    return {
      invoiceName,
      organizationName,
      cleanOrganizationName,
      separatedPeriodCode,
      invoicePath,
      invoiceDir,
    };
  }

  private async makeInvoiceName(appartmentId, accountId, periodCode) {
    const organizationName =
      await this.accountsService.getOrganizationNameByAccountId(accountId);
    const cleanOrganizationName = organizationName.trim().replace(/\"/g, '');
    const separatedPeriodCode = this.getSeparatedPeriodCode(periodCode);
    const invoiceName = `${cleanOrganizationName}_${separatedPeriodCode}_${appartmentId}_${accountId}.pdf`;
    return {
      invoiceName,
      organizationName,
      cleanOrganizationName,
      separatedPeriodCode,
    };
  }

  private getDataKeyFromInvoiceName(invoiceName, dataKey: InvoiceDataKeys) {
    const match = invoiceName.match(INVOICE_DATA_REGEXP);
    return match.groups[dataKey];
  }

  private getDirectoryForPeriod(appartmentId: number, periodCode: number) {
    const separatedPeriodCode = this.getSeparatedPeriodCode(periodCode);
    const path = `src/assets/pdf/${appartmentId}/${separatedPeriodCode}`;
    const isDirExists = fs.existsSync(path);
    if (!isDirExists) {
      fs.mkdirSync(path, { recursive: true });
    }

    return path;
  }

  private getSeparatedPeriodCode(periodCode) {
    const year = String(periodCode).slice(0, 4);
    const month = String(periodCode).slice(4, 6);
    return `${year}-${month}`;
  }
}
