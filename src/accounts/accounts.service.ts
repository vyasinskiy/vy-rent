import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiService } from 'src/api.service';
import { AppartmentsService } from '../appartments/appartments.service';
import { Account, AccountDocument } from './account.schema';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name)
    private accountModel: Model<AccountDocument>,
    private readonly apiService: ApiService,
    private readonly appartmentsService: AppartmentsService,
  ) {}

  async updateAccounts() {
    const appartmentsList = await this.appartmentsService.getAppartmentsList();
    for await (const appartment of appartmentsList) {
      const { accounts } = await this.apiService.getAppartmentAccounts(
        appartment._id,
      );
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
        filter: criteria,
      })
      .exec();
  }

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
