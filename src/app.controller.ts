import { Body, Controller, Injectable, Logger, Post } from '@nestjs/common';
import { BotService } from './bot/bot.service';

@Injectable()
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly botService: BotService) {}

  @Post('fail')
  public async fail(@Body() body) {
    this.logger.log(body);
    this.botService.sendMessage(743866013, JSON.stringify(body));
  }

  @Post('success')
  public async success(@Body() body) {
    this.logger.log(body);
    setInterval(() => {
      this.botService.sendMessage(743866013, JSON.stringify(body)); // vy
      this.botService.sendMessage(1020267807, JSON.stringify(body)); // ny
    }, 2000);
  }
}
