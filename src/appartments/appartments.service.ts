import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiService } from 'src/api.service';
import { Appartment, AppartmentDocument } from './appartment.schema';

@Injectable()
export class AppartmentsService {
  constructor(
    @InjectModel(Appartment.name)
    private appartmentModel: Model<AppartmentDocument>,
    private readonly apiService: ApiService,
  ) {}

  async updateAppartmentsList() {
    const appartmentList = await this.apiService.getAppartmentList();

    for await (const appartment of appartmentList) {
      const { id, address, description, debt } = appartment;
      const appartmentEntity = await this.appartmentModel.findOne({ _id: id });
      if (!appartmentEntity) {
        await this.createAppartment(id, address, description, debt);
      } else {
        // recursively check changies
      }
    }
  }

  async getAppartmentsList() {
    return this.appartmentModel.find().exec();
  }

  async createAppartment(id, address, description, debt = 0) {
    const { accounts } = await this.apiService.getAppartmentAccounts(id);
    const newEntity = await new this.appartmentModel({
      _id: id,
      address: address,
      description: description,
      accounts: accounts.map((account) => +account.id),
      debt: debt,
    });
    await newEntity.save();
    return newEntity;
  }
}
