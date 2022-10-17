import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountsService } from 'src/accounts/accounts.service';
import { ApiService } from 'src/api/api.service';
import { Accrual, AccrualDocument } from './accruals.schema';

@Injectable()
export class AccrualsService {
  private readonly logger = new Logger(AccrualsService.name);

  constructor(
    @InjectModel(Accrual.name)
    private accrualModel: Model<AccrualDocument>,
    private readonly apiService: ApiService,
    private readonly accountService: AccountsService,
  ) {}

  async getAccrualsForAccount(accountId) {
    return await this.accrualModel
      .find({
        accountId,
      })
      .exec();
  }

  async getAccrualsForAppartment(appartmentId: string) {
    return await this.accrualModel
      .find({
        appartmentId,
      })
      .exec();
  }

  async updateAccrualsForAccount(accountId) {
    this.logger.log(`Updating accruals for account: ${accountId}`);

    const account = await this.accountService.findOne({ _id: accountId });
    if (!account) {
      this.logger.error(`Failed to get account by ID: ${accountId}`);
      return;
    }

    const accruals = await this.apiService.getAccountAccruals(accountId);
    if (!accruals) {
      this.logger.error(`Failed to get accruals for ${account.address}`);
      return;
    }

    const dbAccruals = await this.getAccrualsForAccount(accountId);
    const accrualsToSave = accruals.filter(
      (accrual) =>
        !dbAccruals.some(
          (dbAccrual) =>
            dbAccrual.accountId === accrual.accountId &&
            dbAccrual.periodId === accrual.periodId,
        ),
    );

    for await (const accrual of accrualsToSave) {
      const {
        accountId,
        periodName,
        periodId,
        inBalance,
        sum,
        fine,
        toPay,
        payed,
        invoiceExists,
      } = accrual;
      await this.create({
        accountId,
        appartmentId: account.appartmentId,
        periodName,
        periodId,
        inBalance,
        sum,
        fine,
        toPay,
        payed,
        invoiceExists,
      });
    }
  }

  async create(dto) {
    const newEntity = await new this.accrualModel(dto);
    await newEntity.save();
    return newEntity;
  }
}
