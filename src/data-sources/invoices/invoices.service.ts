import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
// import { writeFile } from 'fs/promises';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { Model } from 'mongoose';
import { ApiService, AppartmentAccount } from 'src/api.service';
import { getCurrentPeriodCode } from 'src/assets/helpers';
import { AccountsService } from '../accounts/accounts.service';
import { Invoice, InvoiceDocument } from './invoice.schema';
// import { Account, AccountDocument } from './schemas/account.schema';
// import { Appartment, AppartmentDocument } from './schemas/appartment.schema';
// import { Invoice, InvoiceDocument } from './invoices/invoice.schema';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name)
    private invoiceModel: Model<InvoiceDocument>,
    private readonly apiService: ApiService,
    private readonly accountsService: AccountsService,
  ) {}

  async updateInvoicesForPeriod(
    apparmentId: number,
    account: AppartmentAccount,
    periodCode: number,
  ) {
    const invoicesDirPath = this.getDirectoryForPeriod(apparmentId, periodCode);
    const existedInvoices = fs.readdirSync(invoicesDirPath);
    const accountsToIgnore = existedInvoices.map((invoice) =>
      this.getAccountFromInvoiceName(invoice),
    );
    const appartmentAccounts =
      await this.accountsService.getAccountsForAppartment(apparmentId);
  }

  getAccountFromInvoiceName(fileName) {
    return fileName;
  }

  getInvoiceForPeriod(
    apparmentId: number,
    account: AppartmentAccount,
    periodCode: number,
  ) {
    const filePath = `src/assets/pdf/${apparmentId}/${periodCode}/${account.id}-${periodCode}.pdf`;

    return filePath;
  }

  async fetchInvoiceForPeriod(accountId, periodCode) {
    const { data } = await this.apiService.getInvoice(accountId, periodCode);

    return data;
  }

  getDirectoryForPeriod(apparmentId: number, periodCode: number) {
    const path = `src/assets/pdf/${apparmentId}/${periodCode}`;
    const isDirExists = fs.existsSync(path);
    if (!isDirExists) {
      fs.mkdirSync(path);
    }

    return path;
  }

  getInvoicesFromDir(dir) {
    return fs.readdirSync(dir);
  }

  async updateAll() {
    const currentPeriod = getCurrentPeriodCode();
    // const invoicesDir = this.getFolderForPeriod(currentPeriod);
    // const invoices = this.getInvoicesFromDir(invoicesDir);

    // if (invoices.length)
    // const { data } = await this.apiService.getInvoice(
    //   account.id,
    //   currentPeriod,
    // );

    // await writeFile(
    //   `src/assets/pdf/${account.id}-${currentPeriod}.pdf`,
    //   data,
    // );
  }

  // async create(entity, dto): Promise<any> {
  //   const newEntity = await new this.appartmentModel(dto);
  //   await newEntity.save();
  // }

  // async findAll(): Promise<Appartment[]> {
  //   return this.appartmentModel.find().exec();
  // }
}
