import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsModule } from 'src/accounts/accounts.module';
import { ApiModule } from 'src/api/api.module';
import { Accrual, AccrualSchema } from './accruals.schema';
import { AccrualsService } from './accruals.service';

@Module({
  imports: [
    ApiModule,
    AccountsModule,
    MongooseModule.forFeature([{ name: Accrual.name, schema: AccrualSchema }]),
  ],
  providers: [AccrualsService],
  exports: [AccrualsService],
})
export class AccrualsModule {}
