import { Injectable, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import PQueue from 'p-queue';

@Injectable()
export class GroupManagerService {
  private readonly queue: PQueue;
  private readonly bot: TelegramBot;
  private readonly chatId: number;
  private readonly logger = new Logger(GroupManagerService.name);

  constructor(bot: TelegramBot, queue: PQueue, chatId: number) {
    this.queue = queue;
    this.chatId = chatId;
  }

  public sendMessage = async (
    text: string,
    options?: TelegramBot.SendMessageOptions,
  ) => {
    this.queue.add(() => this.bot.sendMessage(this.chatId, text, options));
  };
}
