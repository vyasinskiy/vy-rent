import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiService } from 'src/api.service';
import { Account, AccountDocument } from './schemas/account.schema';
import { Appartment, AppartmentDocument } from './schemas/appartment.schema';
import { Invoice, InvoiceDocument } from './schemas/invoice.schema';

@Injectable()
export class DataSourceService {
  constructor(
    @InjectModel(Appartment.name)
    private appartmentModel: Model<AppartmentDocument>,
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
    @InjectModel(Invoice.name)
    private invoiceModel: Model<InvoiceDocument>,
    private readonly apiService: ApiService,
  ) {}

  async getInvoicesForMonth(periodCode) {
    return await this.invoiceModel.find({
      filter: {
        periodCode,
      },
    });
  }

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

    for (const account of accountsData) {
      const { apparmentId, accounts } = account;
      for await (const account of accounts) {
        const _id = account.id;
        const accountEntity = await this.accountModel.findOne({ _id });
        if (!accountEntity) {
          const createdEntity = await new this.accountModel({
            _id: account.id,
            appartmentId: apparmentId,
            organizationName: account.organizationName,
            organizationId: account.organizationId,
            address: account.address,
            number: account.number,
            debt: account.debt,
            type: account.type,
          });
          await createdEntity.save();
        } else {
          // recursively check changies
        }
      }
    }

    // for await (const account of accounts) {
    //   try {
    //     const currentPeriod = Number(getCurrentPeriod());
    //     const { accountId, period, data } = await this.apiService.getInvoice(
    //       account.id,
    //       currentPeriod,
    //     );
    //     await writeFile(`${accountId}-${period}.pdf`, data);
    //   } catch {
    //     debugger;
    //   }
    // }
  }

  async create(entity, dto): Promise<any> {
    const newEntity = await new this.appartmentModel(dto);
    await newEntity.save();
  }

  async findAll(): Promise<Appartment[]> {
    return this.appartmentModel.find().exec();
  }
}
