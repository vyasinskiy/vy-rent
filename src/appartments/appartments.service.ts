import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiService } from 'src/api/api.service';
import { Appartment, AppartmentDocument } from './appartment.schema';

@Injectable()
export class AppartmentsService {
  private readonly logger = new Logger(AppartmentsService.name);

  constructor(
    @InjectModel(Appartment.name)
    private appartmentModel: Model<AppartmentDocument>,
    private readonly apiService: ApiService,
  ) {}

  public async updateAppartmentsList() {
    const appartmentsList = await this.apiService.getAppartmenstList();

    if (!appartmentsList) {
      this.logger.error('Error while fetching appartments list');
      return;
    }

    for await (const appartment of appartmentsList) {
      const { id, address, description, debt } = appartment;
      const appartmentEntity = await this.appartmentModel.findOne({ _id: id });
      if (!appartmentEntity) {
        await this.createAppartment(id, address, description, debt);
      } else {
        for await (const [key, value] of Object.entries(appartment)) {
          const dbValue = appartmentEntity[key];

          if ((dbValue && value !== dbValue) || dbValue instanceof Object) {
            await appartmentEntity.updateOne({
              [key]: value,
            });
          }
        }
      }
    }
    this.logger.log('Appartments are updated!');
  }

  public async getAppartmentsList() {
    return this.appartmentModel.find().exec();
  }

  public async getAppartmentById(appartmentId: string) {
    return await this.appartmentModel.findOne({
      _id: appartmentId,
    });
  }

  private async createAppartment(id, address, description, debt = 0) {
    const { accounts } = await this.apiService.getAppartmentAccounts(id);

    if (!accounts) {
      this.logger.error(
        'Error while creating appartment: no accounts retrieved',
      );
      return;
    }

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
