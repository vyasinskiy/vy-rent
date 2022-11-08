import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from 'src/app.module';
import { BotService } from './bot.service';

@Module({
  imports: [ConfigModule, forwardRef(() => AppModule)],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
