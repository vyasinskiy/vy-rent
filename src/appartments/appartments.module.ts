import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppartmentsService } from './appartments.service';
import { Appartment, AppartmentSchema } from './schemas/appartment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appartment.name, schema: AppartmentSchema },
    ]),
  ],
  providers: [AppartmentsService],
})
export class CatsModule {}
