import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
// import { writeFile } from 'fs/promises';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { Model } from 'mongoose';
import { ApiService, AppartmentAccount } from 'src/api.service';
import { getCurrentPeriodCode } from 'src/assets/helpers';
import { Account, AccountDocument } from './account.schema';
// import { Account, AccountDocument } from './schemas/account.schema';
// import { Appartment, AppartmentDocument } from './schemas/appartment.schema';
// import { Invoice, InvoiceDocument } from './invoices/invoice.schema';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
    private readonly apiService: ApiService,
  ) {}

  async getAccountsForAppartment(apparmentId) {
    return this.accountModel
      .find({
        filter: {
          apparmentId,
        },
      })
      .exec();
  }
}
