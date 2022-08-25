import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiModule } from 'src/api/api.module';
import { AppartmentsModule } from 'src/appartments/appartments.module';
import { Account, AccountSchema } from './account.schema';
import { AccountsService } from './accounts.service';

@Module({
  imports: [
    ApiModule,
    AppartmentsModule,
    MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }]),
  ],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
