import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthService } from './auth/auth.service';
import { ConfigModule } from '@nestjs/config';
import { ApiService } from './api.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './accounts/account.schema';
import { AccountsService } from './accounts/accounts.service';
import { Appartment, AppartmentSchema } from './appartments/appartment.schema';
import { Invoice, InvoicesSchema } from './invoices/invoice.schema';
import { InvoiceService } from './invoices/invoices.service';
import { AppartmentsService } from './appartments/appartments.service';
import { AccrualsService } from './accruals/accruals.service';
import { Accrual, AccrualSchema } from './accruals/accruals.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // the same as mongoose.connect()
    MongooseModule.forRoot(
      'mongodb+srv://Vitaliy:HrBl3rWgNftMdezO@cluster0.vjfia.mongodb.net/?retryWrites=true&w=majority',
    ),
    MongooseModule.forFeature([
      { name: Appartment.name, schema: AppartmentSchema },
      { name: Invoice.name, schema: InvoicesSchema },
      { name: Account.name, schema: AccountSchema },
      { name: Accrual.name, schema: AccrualSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AuthService,
    ApiService,
    InvoiceService,
    AccountsService,
    AppartmentsService,
    AccrualsService,
  ],
})
export class AppModule {}
