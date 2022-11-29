import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountsService } from 'src/accounts/accounts.service';
import { AccrualData, ApiService } from 'src/api/api.service';
import { isEqual } from 'src/assets/helpers';
import { Accrual, AccrualDocument } from './accruals.schema';

type AccrualProperties = Omit<AccrualData, 'button'> & { appartmentId: number };

@Injectable()
export class AccrualsService {
  private readonly logger = new Logger(AccrualsService.name);

  constructor(
    @InjectModel(Accrual.name)
    private accrualModel: Model<AccrualDocument>,
    private readonly apiService: ApiService,
    private readonly accountService: AccountsService,
  ) {}

  public async getAccrualsForAccount(accountId) {
    return await this.accrualModel
      .find({
        accountId,
      })
      .exec();
  }

  public async getAccrualsForAppartment(appartmentId: string) {
    const accruals = await this.accrualModel
      .find({
        appartmentId,
      })
      .exec();

    return accruals.sort((a, b) => a.periodId - b.periodId);
  }

  public async updateAccrualsForAccount(accountId) {
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

    const accrualsToSave: AccrualData[] = [];
    const accrualsToUpdate: {
      fetchedAccrual: AccrualData;
      dbAccrual: AccrualDocument;
    }[] = [];

    for (const fetchedAccrual of fetchedAccruals) {
      const dbAccrual = dbAccruals.find(
        (dbAccrual) =>
          dbAccrual.accountId === fetchedAccrual.accountId &&
          dbAccrual.periodId === fetchedAccrual.periodId,
      );

      if (!dbAccrual) {
        this.logger.log(
          `Found new accrual: \naccountId: ${accountId}\nperiodId: ${fetchedAccrual.periodId}\naddress: ${account.address}`,
        );

        accrualsToSave.push(fetchedAccrual);
        continue;
      }

      const areAccrualsEqual = isEqual(fetchedAccrual, dbAccrual);
      if (!areAccrualsEqual) {
        const log =
          'Found accrual with updates:\n' +
          'fetchedAccrual:\n' +
          JSON.stringify(fetchedAccrual) +
          '\n' +
          'dbAccrual:\n' +
          JSON.stringify(dbAccrual);

        this.logger.log(log);
        accrualsToUpdate.push({ fetchedAccrual, dbAccrual });
      }
    }

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

      const newAccrual = {
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
      };

      await this.create(newAccrual);
    }

    for await (const { dbAccrual, fetchedAccrual } of accrualsToUpdate) {
      const updateAccrual = {
        accountId,
        appartmentId: account.appartmentId,
        periodName: fetchedAccrual.periodName,
        periodId: fetchedAccrual.periodId,
        inBalance: fetchedAccrual.inBalance,
        sum: fetchedAccrual.sum,
        fine: fetchedAccrual.fine,
        toPay: fetchedAccrual.toPay,
        payed: fetchedAccrual.payed,
        invoiceExists: fetchedAccrual.invoiceExists,
      };

      await this.update(dbAccrual.id, updateAccrual);
    }
  }

  private async create(newAccrual: AccrualProperties) {
    const newEntity = await new this.accrualModel(newAccrual);
    await newEntity.save();
    return newEntity;
  }

  private async update(id: string, updateAccrual: AccrualProperties) {
    await this.accrualModel.findByIdAndUpdate(id, updateAccrual);
  }
}
