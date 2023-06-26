import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module';
import { AccrualsModule } from './accruals/accruals.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ApiModule } from './api/api.module';
import { AppartmentsModule } from './appartments/appartments.module';
import { AuthModule } from './auth/auth.module';
import { AppService } from './app.service';
import { BotModule } from './bot/bot.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    AccountsModule,
    AccrualsModule,
    ApiModule,
    AppartmentsModule,
    AuthModule,
    BotModule,
    InvoicesModule,
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        uri: config.get('MONGODB_URI'),
      }),
    }),
  ],
  providers: [AppService],
  exports: [AppService],
  controllers: [AppController],
})
export class AppModule {}
