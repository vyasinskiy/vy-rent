import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appartment, AppartmentSchema } from './schemas/appartment.schema';
import { DataSourceService } from './data-source.service';
import { Invoice, InvoicesSchema } from './invoices/invoice.schema';
import { ApiService } from 'src/api.service';
import { AuthService } from 'src/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { Account, AccountSchema } from './accounts/account.schema';
import { AccountsService } from './accounts/accounts.service';
import { InvoiceService } from './invoices/invoices.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appartment.name, schema: AppartmentSchema },
      { name: Invoice.name, schema: InvoicesSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  providers: [
    DataSourceService,
    ApiService,
    AuthService,
    ConfigService,
    InvoiceService,
    AccountsService,
  ],
})
export class DataSourceModule {}
