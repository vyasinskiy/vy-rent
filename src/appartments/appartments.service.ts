import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Appartment, AppartmentDocument } from './schemas/appartment.schema';
// import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class AppartmentsService {
  constructor(
    @InjectModel(Appartment.name)
    private appartmentModel: Model<AppartmentDocument>,
  ) {}

  //   async create(createCatDto: CreateCatDto): Promise<Cat> {
  async create(appartmentDto: any): Promise<Appartment> {
    const createdCat = new this.appartmentModel(appartmentDto);
    return createdCat.save();
  }

  async findAll(): Promise<Appartment[]> {
    return this.appartmentModel.find().exec();
  }
}
