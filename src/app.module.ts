import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthService } from './auth/auth.service';
import { ConfigModule } from '@nestjs/config';
import { ApiService } from './api.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DataSourceModule } from './data-sources/data-source.module';
import { DataSourceService } from './data-sources/data-source.service';
import {
  Appartment,
  AppartmentSchema,
} from './data-sources/schemas/appartment.schema';
import { Invoice, InvoicesSchema } from './data-sources/schemas/invoice.schema';
import { Account, AccountSchema } from './data-sources/schemas/account.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // the same as mongoose.connect()
    MongooseModule.forRoot(
      'mongodb+srv://Vitaliy:HrBl3rWgNftMdezO@cluster0.vjfia.mongodb.net/?retryWrites=true&w=majority',
    ),
    DataSourceModule,
    MongooseModule.forFeature([
      { name: Appartment.name, schema: AppartmentSchema },
      { name: Invoice.name, schema: InvoicesSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [AuthService, ApiService, DataSourceService],
})
export class AppModule {}
