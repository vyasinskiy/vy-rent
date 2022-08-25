import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './schedule/task.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccountsModule } from './accounts/accounts.module';
import { AccrualsModule } from './accruals/accruals.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ApiModule } from './api/api.module';
import { AppartmentsModule } from './appartments/appartments.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AccountsModule,
    AccrualsModule,
    ApiModule,
    AppartmentsModule,
    AuthModule,
    InvoicesModule,
    TasksModule,
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
  controllers: [AppController],
})
export class AppModule {}
