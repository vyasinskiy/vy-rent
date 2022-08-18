import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { ApiService } from './api.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsModule } from './appartments/appartments.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // the same as mongoose.connect()
    MongooseModule.forRoot(
      'mongodb+srv://Vitaliy:HrBl3rWgNftMdezO@cluster0.vjfia.mongodb.net/?retryWrites=true&w=majority',
    ),
    CatsModule,
  ],
  controllers: [AppController],
  providers: [AuthService, ApiService],
})
export class AppModule {}
