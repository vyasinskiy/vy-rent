import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appartment, AppartmentSchema } from './schemas/appartment.schema';
import { DataSourceService } from './data-source.service';
import { Invoice, InvoicesSchema } from './schemas/invoice.schema';
import { ApiService } from 'src/api.service';
import { AuthService } from 'src/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { Account, AccountSchema } from './schemas/account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appartment.name, schema: AppartmentSchema },
      { name: Invoice.name, schema: InvoicesSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  providers: [DataSourceService, ApiService, AuthService, ConfigService],
})
export class DataSourceModule {}
