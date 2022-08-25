import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsModule } from 'src/accounts/accounts.module';
import { ApiModule } from 'src/api/api.module';
import { Invoice, InvoicesSchema } from './invoice.schema';
import { InvoiceService } from './invoices.service';

@Module({
  imports: [
    ApiModule,
    AccountsModule,
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoicesSchema }]),
  ],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoicesModule {}
