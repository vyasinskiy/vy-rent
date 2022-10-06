import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class BotService {
  private readonly bot: TelegramBot | null;

  constructor(private configService: ConfigService) {
    const token = this.configService.get('TELEGRAM_API_TOKEN');
    this.bot = new TelegramBot(token, { polling: true });
    this.setup();
  }

  setup() {
    this.bot.on('message', this.handleMessage);
  }

  handleMessage = (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    this.bot.sendMessage(chatId, `you sent me ${msg.text}`);
  };
}
