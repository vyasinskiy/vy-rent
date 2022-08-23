import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as fs from 'fs';
import { writeFile } from 'fs/promises';
import { Model } from 'mongoose';
import { ApiService } from 'src/api.service';
import { AccountsService } from '../accounts/accounts.service';
import { Invoice, InvoiceDocument } from './invoice.schema';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name)
    private invoiceModel: Model<InvoiceDocument>,
    private readonly apiService: ApiService,
    private readonly accountsService: AccountsService,
  ) {}

  async updateInvoicesForPeriod(appartmentId: number, periodCode: number) {
    const invoicesDirPath = this.getDirectoryForPeriod(
      appartmentId,
      periodCode,
    );
    const existedInvoices = fs.readdirSync(invoicesDirPath);

    const appartmentAccounts =
      await this.accountsService.getAccountsForAppartment(appartmentId);
    const accountsToIgnore = existedInvoices.map((invoice) =>
      this.getAccountFromInvoiceName(invoice),
    );
    const accountsToFetch = appartmentAccounts.filter(
      (account) => !accountsToIgnore.includes(account._id),
    );
    for await (const account of accountsToFetch) {
      const invoice = await this.fetchInvoiceForPeriod(account._id, periodCode);
      const invoicePath = this.constructInvoicePath(
        appartmentId,
        periodCode,
        account._id,
      );
      await this.saveInvoice(invoice, invoicePath);
      // await this.create({
      //   appartmentId,
      //   accountId: account._id,
      //   periodCode,
      //   src: invoicePath,
      // });
    }
  }

  constructInvoicePath(apparmentId, periodCode, accountId) {
    const invoiceDir = `src/assets/pdf/${apparmentId}/${periodCode}/`;
    const invoiceName = `${accountId}-${periodCode}.pdf`;
    return invoiceDir + invoiceName;
  }

  async saveInvoice(invoice, invoicePath) {
    // TODO: how to use fs.writeFileSync(invoicePath, invoice)?
    await writeFile(invoicePath, invoice);
  }

  getAccountFromInvoiceName(fileName) {
    return fileName.split('-')[0];
  }

  async fetchInvoiceForPeriod(accountId, periodCode) {
    const { data } = await this.apiService.getInvoice(accountId, periodCode);

    return data;
  }

  getDirectoryForPeriod(apparmentId: number, periodCode: number) {
    const path = `src/assets/pdf/${apparmentId}/${periodCode}`;
    const isDirExists = fs.existsSync(path);
    if (!isDirExists) {
      fs.mkdirSync(path, { recursive: true });
    }

    return path;
  }

  async create(dto: Invoice): Promise<any> {
    const newEntity = await new this.invoiceModel(dto);
    await newEntity.save();
  }

  // async findAll(): Promise<Appartment[]> {
  //   return this.appartmentModel.find().exec();
  // }
}
