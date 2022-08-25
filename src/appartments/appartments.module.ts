import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiModule } from 'src/api/api.module';
import { AppartmentsService } from 'src/appartments/appartments.service';
import { Appartment, AppartmentSchema } from './appartment.schema';

@Module({
  imports: [
    ApiModule,
    MongooseModule.forFeature([
      { name: Appartment.name, schema: AppartmentSchema },
    ]),
  ],
  providers: [AppartmentsService],
  exports: [AppartmentsService],
})
export class AppartmentsModule {}
