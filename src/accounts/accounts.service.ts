import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiService } from 'src/api/api.service';
import { cleanWhiteSpaces } from 'src/assets/helpers';
import { AppartmentsService } from '../appartments/appartments.service';
import { Account, AccountDocument } from './account.schema';

@Injectable()
export class AccountsService {
  private mapAccountToOrganization: Record<number, string>;
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
    private readonly apiService: ApiService,
    private readonly appartmentsService: AppartmentsService,
  ) {}

  async getAllAccounts() {
    return this.accountModel.find().exec();
  }

  async getAccountsForAppartment(appartmentId) {
    return this.accountModel
      .find({
        appartmentId,
      })
      .exec();
  }

  async getOrganizationNameByAccountId(accountId) {
    if (!this.mapAccountToOrganization) {
      await this.doMapAccountToOrganization();
    }

    const name = this.mapAccountToOrganization[accountId];
    return cleanWhiteSpaces(name);
  }

  async updateAccounts() {
    const appartmentsList = await this.appartmentsService.getAppartmentsList();
    for await (const appartment of appartmentsList) {
      const { accounts } = await this.apiService.getAppartmentAccounts(
        appartment._id,
      );

      if (!accounts) {
        this.logger.error(
          'Unsuccessful accounts updates: No accounts retrieved while fetching',
        );
        return;
      }

      for await (const account of accounts) {
        const { id, organizationName, organizationId, address, debt, type } =
          account;
        const accountEntity = await this.accountModel.findOne({
          _id: account.id,
        });
        if (!accountEntity) {
          await this.create(
            id,
            appartment._id,
            organizationName,
            organizationId,
            address,
            debt,
            type,
          );
        } else {
          // recursively check changies
        }
      }
    }
    this.logger.log('Accounts were updated!');
  }

  async create(
    id,
    appartmentId,
    organizationName,
    organizationId,
    address,
    debt = 0,
    type,
  ) {
    const newEntity = await new this.accountModel({
      _id: id,
      appartmentId,
      organizationName,
      organizationId,
      address,
      debt: debt,
      type,
    });
    await newEntity.save();
    return newEntity;
  }

  async findOne(criteria) {
    return this.accountModel
      .findOne({
        ...criteria,
      })
      .exec();
  }

  private async doMapAccountToOrganization() {
    this.mapAccountToOrganization = {};
    const accounts = await this.getAllAccounts();

    for (const account of accounts) {
      if (!this.mapAccountToOrganization[account._id]) {
        this.mapAccountToOrganization[account._id] = account.organizationName;
      }
    }
  }
}
