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
    const accruals = await this.accrualModel
      .find({
        appartmentId,
      })
      .exec();

    return accruals.sort((a, b) => a.periodId - b.periodId);
  }

  async updateAccrualsForAccount(accountId) {
    this.logger.log(`Updating accruals for accountId: ${accountId}`);

    const account = await this.accountService.findOne({ _id: accountId });
    if (!account) {
      this.logger.error(`Failed to get account by ID: ${accountId}`);
      return;
    }

    const fetchedAccruals = await this.apiService.getAccountAccruals(accountId);
    if (!fetchedAccruals) {
      this.logger.error(`Failed to get accruals for ${account.address}`);
      return;
    }

    const dbAccruals = await this.getAccrualsForAccount(accountId);
    const accrualsToSave = fetchedAccruals.filter(
      (fetchedAccrual) =>
        !dbAccruals.some((dbAccrual) => {
          const isDbAccrualEqual =
            dbAccrual.accountId === fetchedAccrual.accountId &&
            dbAccrual.periodId === fetchedAccrual.periodId;

          return isDbAccrualEqual;
        }),
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

      this.logger.log(
        `Found new accrual: \naccountId: ${accountId}\nperiodId: ${periodId}\naddress: ${account.address}`,
      );

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
