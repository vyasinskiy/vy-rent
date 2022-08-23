import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiService } from 'src/api.service';
import { getCurrentPeriodCode } from 'src/assets/helpers';
import { Account, AccountDocument } from './accounts/account.schema';
import { Appartment, AppartmentDocument } from './schemas/appartment.schema';
import { InvoiceService } from './invoices/invoices.service';

@Injectable()
export class DataSourceService {
  constructor(
    @InjectModel(Appartment.name)
    private appartmentModel: Model<AppartmentDocument>,
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
    private readonly apiService: ApiService, // private readonly invoiceService: InvoiceService,
  ) {}

  // async getInvoicesForMonth(periodCode) {
  //   return await this.invoiceModel.find({
  //     filter: {
  //       periodCode,
  //     },
  //   });
  // }

  async updateAll() {
    const appartmentList = await this.apiService.getAppartmentList();

    for await (const appartment of appartmentList) {
      const _id = appartment.id;
      const appartmentEntity = await this.appartmentModel.findOne({ _id });
      if (!appartmentEntity) {
        const createdEntity = await new this.appartmentModel({
          _id: appartment.id,
          address: appartment.address,
          description: appartment.description,
          debt: appartment.debt,
        });
        await createdEntity.save();
      } else {
        // recursively check changies
      }
    }

    const accountsRequests = appartmentList.map((appartment) =>
      this.apiService.getAppartmentAccounts(appartment.id),
    );
    const accountsData = (await Promise.all(accountsRequests)).flat();

    const currentPeriod = getCurrentPeriodCode();

    for (const account of accountsData) {
      const { apparmentId, accounts } = account;
      for await (const account of accounts) {
        const _id = account.id;
        const accountEntity = await this.accountModel.findOne({ _id });
        if (!accountEntity) {
          const newAccountEntity = await new this.accountModel({
            _id: account.id,
            appartmentId: apparmentId,
            organizationName: account.organizationName,
            organizationId: account.organizationId,
            address: account.address,
            number: account.number,
            debt: account.debt,
            type: account.type,
          });
          await newAccountEntity.save();
        } else {
          // recursively check changies
        }

        // const invoice = await this.invoiceService.getInvoiceForPeriod(
        //   apparmentId,
        //   account,
        //   currentPeriod,
        // );
      }
    }
  }

  async create(entity, dto): Promise<any> {
    const newEntity = await new this.appartmentModel(dto);
    await newEntity.save();
  }

  async findAll(): Promise<Appartment[]> {
    return this.appartmentModel.find().exec();
  }
}
