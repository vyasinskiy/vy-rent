import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { DataProviderService } from './data-provider.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AuthService, DataProviderService],
})
export class AppModule {}
