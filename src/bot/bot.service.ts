import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const TelegramBot = require('node-telegram-bot-api');

@Injectable()
export class BotService {
  private readonly bot: TelegramBot | null;
  private token: string;

  constructor(private configService: ConfigService) {
    this.token = this.configService.get('TELEGRAM_API_TOKEN');
    this.bot = new TelegramBot(this.token, { polling: true });
    this.bot.on('message', this.handleMessage);
  }

  handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    this.bot.sendMessage(chatId, 'test');
  }
}
