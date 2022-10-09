import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccrualsModule } from 'src/accruals/accruals.module';
import { AppartmentsModule } from 'src/appartments/appartments.module';
import { InvoicesModule } from 'src/invoices/invoices.module';
import { BotService } from './bot.service';

@Module({
  imports: [ConfigModule, AppartmentsModule, AccrualsModule, InvoicesModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
