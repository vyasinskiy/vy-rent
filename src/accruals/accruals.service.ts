import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountsService } from 'src/accounts/accounts.service';
import { ApiService } from 'src/api.service';
import { Accrual, AccrualDocument } from './accruals.schema';

@Injectable()
export class AccrualsService {
  constructor(
    @InjectModel(Accrual.name)
    private accrualModel: Model<AccrualDocument>,
    private readonly apiService: ApiService,
    private readonly accountService: AccountsService,
  ) {}

  async updateAccrualsForAccount(accountId) {
    const account = await this.accountService.findOne({ accountId });
    const accruals = await this.apiService.getAccountAccruals(accountId);
    const dbAccruals = await this.accrualModel.find({
      accountId,
    });
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
