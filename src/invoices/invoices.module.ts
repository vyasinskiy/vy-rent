import { Module } from '@nestjs/common';
import { AccountsModule } from 'src/accounts/accounts.module';
import { ApiModule } from 'src/api/api.module';
import { AppartmentsModule } from 'src/appartments/appartments.module';
import { InvoiceService } from './invoices.service';

@Module({
  imports: [ApiModule, AccountsModule, AppartmentsModule],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoicesModule {}
