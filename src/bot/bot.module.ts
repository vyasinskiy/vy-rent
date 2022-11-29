import { forwardRef, Module } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { BotService } from './bot.service';

@Module({
  imports: [forwardRef(() => AppModule)],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
