import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import TelegramBot from 'node-telegram-bot-api';
import PQueue from 'p-queue';
import { AppService } from 'src/app.service';
import { BotCommands } from 'src/assets/constants';
import { Stream } from 'stream';
import {
  GetAppartmentsProps,
  GetDebstProps,
  GetInvoiceProps,
  GetPeriodProps,
  UpdateInvoicesProps,
} from './bot.types';

const CB_QUERY_REGEXP = /(?<chatId>\w+)(\/)(?<method>\w+)(\/)?(?<data>\w+)?/;

@Injectable()
export class BotService {
  private readonly bot: TelegramBot;
  private readonly pQueue: PQueue;
  private readonly logger = new Logger(BotService.name);
  private readonly minSupportedPeriodCode = this.configService.get(
    'MIN_SUPPORTED_PERIOD_CODE',
  );

  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
  ) {
    this.bot = this.setupBot();
    this.pQueue = new PQueue({
      concurrency: 1,
      interval: 1000,
      intervalCap: 1,
    });
  }

  public sendMessage = async (
    chatId: number,
    text: string,
    options?: TelegramBot.SendMessageOptions,
  ) => {
    this.pQueue.add(() => this.bot.sendMessage(chatId, text, options));
  };

  public sendDocument = async (
    chatId: number,
    doc: string | Stream | Buffer,
    options?: TelegramBot.SendDocumentOptions,
    fileOptions?: TelegramBot.FileOptions,
  ) => {
    this.pQueue.add(() =>
      this.bot.sendDocument(chatId, doc, options, fileOptions),
    );
  };

  private setupBot() {
    const bot = new TelegramBot(
      this.configService.get('TELEGRAM_API_TOKEN') as string,
      {
        polling: true,
      },
    );
    bot.on('message', this.handleMessage);
    bot.on('callback_query', this.handleCallbackQuery);

    return bot;
  }

  private handleCallbackQuery = async (msg: TelegramBot.CallbackQuery) => {
    this.logger.log('Received callback query:', msg);

    const callbackQueryErrorLogger = () =>
      this.logger.error('Wrong message data in callbackQuery');

    if (!msg.data) {
      callbackQueryErrorLogger();
      return;
    }

    const match = msg.data.match(CB_QUERY_REGEXP);

    if (!match?.groups) {
      callbackQueryErrorLogger();
      return;
    }

    const chatId = match.groups.chatId;
    const method = match.groups.method;
    const data = match.groups.data;
    this[`on${method}`]({ chatId, msg, data });
  };

  private handleMessage = async (msg: TelegramBot.Message) => {
    this.logger.log('Received message:', msg);

    if (msg.text !== BotCommands.Start) {
      return;
    }

    this.onStart(msg);
  };

  private async onStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    await this.sendMessage(chatId, 'Что нужно сделать?', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Получить счет',
              callback_data: `${chatId}/GetAppartments`,
            },
          ],
          [
            {
              text: 'Состояние задолженности',
              callback_data: `${chatId}/GetDebts`,
            },
          ],
          [
            {
              text: 'Обновить инвойсы',
              callback_data: `${chatId}/UpdateInvoices`,
            },
          ],
        ],
      },
    });
  }

  private async onGetAppartments(props: GetAppartmentsProps) {
    const { chatId } = props;

    const appartmentsList = await this.appService.getAppartmentsList();
    const keyboardOptions = appartmentsList.map((appartment) => [
      {
        text: appartment.address.replace('г Краснодар, ', ''),
        callback_data: `${chatId}/GetPeriod/${appartment._id}`,
      },
    ]);
    await this.sendMessage(chatId, 'По какой квартире?', {
      reply_markup: {
        inline_keyboard: keyboardOptions,
      },
    });
  }

  // TODO: Replace CRON to App.service
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  private async onUpdateInvoices(props: UpdateInvoicesProps) {
    const groupChatId = this.getGroupChatId();
    const chatId = props.chatId ?? groupChatId;

    const newInvoices = await this.appService.getNewInvoices();

    const isScheduledUpdate = !props;

    if (isScheduledUpdate) {
      const groupChatId = this.configService.get('TELEGRAM_GROUP_CHAT_ID');
      if (newInvoices.length === 0) {
        return await this.sendMessage(
          groupChatId,
          'Сегодня новые квитанции не найдены ;(',
        );
      }

      for await (const newInvoice of newInvoices) {
        const { invoicePath, address, separatedPeriodCode } = newInvoice;
        const message = `Получена квитанция:\n\nАдрес:\n${address}\n\nПериод:\n${separatedPeriodCode}`;

        await this.sendInvoice(groupChatId, invoicePath, message);
      }
    } else {
      await this.sendMessage(chatId, 'Квитанции обновлены.');
    }
  }

  private async onGetPeriod(props: GetPeriodProps) {
    const { chatId, data: appartmentId } = props;
    const accruals = await this.appService.getAccrualsForAppartment(
      appartmentId,
    );
    const accounts = await this.appService.getAccountsForAppartment(
      appartmentId,
    );

    const keyboardOptions = accruals.reduce((keyboardOptions, accrual) => {
      if (!accrual.invoiceExists) {
        return keyboardOptions;
      }

      if (accrual.periodId < this.minSupportedPeriodCode) {
        return keyboardOptions;
      }
      const hasMultipleAccounts = accounts.length > 1;

      const accountByAccrual = accounts.find(
        (account) => +account.id === accrual.accountId,
      );

      const additionalPeriodIdentity = accountByAccrual
        ? accountByAccrual.organizationName
        : accrual._id;

      const buttonText = hasMultipleAccounts
        ? `${accrual.periodName}, ${additionalPeriodIdentity}`
        : accrual.periodName;

      return [
        ...keyboardOptions,
        [
          {
            text: buttonText,
            callback_data: `${chatId}/GetInvoice/${accrual.appartmentId}_${accrual.accountId}_${accrual.periodId}`,
          },
        ],
      ];
    }, []);

    await this.sendMessage(chatId, 'Какой период?', {
      reply_markup: {
        inline_keyboard: keyboardOptions,
      },
    });
  }

  private async onGetInvoice(props: GetInvoiceProps) {
    const { chatId, data: invoiceStringData } = props;

    const match = invoiceStringData.match(
      /(?<appartmentId>\w+)_(?<accountId>\w+)_(?<periodCode>\w+)/,
    );

    if (!match?.groups) {
      this.logger.error(
        'Error while matching onGetInvoice data: no match found',
      );
      return;
    }

    const { appartmentId, accountId, periodCode } = match.groups;

    const appartment = await this.appService.getAppartmentById(appartmentId);

    if (!appartment) {
      return this.logger.error(
        `Error while getting appartment: no appartment found by given id: ${appartmentId}`,
      );
    }

    const { invoicePath, separatedPeriodCode } =
      await this.appService.getInvoice(appartmentId, accountId, periodCode);

    const message = `Получена квитанция:\n\nАдрес:\n${appartment.address}\n\nПериод:\n${separatedPeriodCode}`;

    await this.sendInvoice(chatId, invoicePath, message);
  }

  private async onGetDebts(props: GetDebstProps) {
    const { chatId } = props;
    const debts = await this.appService.getDebts();

    for await (const debt of debts) {
      const message = `Адрес: ${debt.address}\nЗадолженность: ${debt.debt}`;
      this.sendMessage(chatId, message);
    }
  }

  private async sendInvoice(chatId: number, docPath: string, message: string) {
    this.logger.log(`Sending document:\nPath: ${docPath}\nMessage: ${message}`);

    await this.sendMessage(chatId, message);
    await this.sendDocument(chatId, docPath);
  }

  private getGroupChatId() {
    const groupChatId = this.configService.get<number>(
      'TELEGRAM_GROUP_CHAT_ID',
    );

    if (!groupChatId) {
      this.logger.error(
        'TELEGRAM_GROUP_CHAT_ID key is not specified in environment',
      );
      return;
    }

    return groupChatId;
  }
}
