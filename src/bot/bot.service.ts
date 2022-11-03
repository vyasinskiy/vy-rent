import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import TelegramBot from 'node-telegram-bot-api';
import PQueue from 'p-queue';
import { AccountsService } from 'src/accounts/accounts.service';
import { AccrualsService } from 'src/accruals/accruals.service';
import { AppartmentsService } from 'src/appartments/appartments.service';
import { BotCommands } from 'src/assets/constants';
import { InvoiceService } from 'src/invoices/invoices.service';
import { Stream } from 'stream';
import {
  GetAppartmentsProps,
  GetInvoiceProps,
  GetPeriodProps,
  UpdateAppartmentsProps,
  UpdateInvoicesProps,
} from './bot.types';
import { GroupManagerService } from './groupManager.service';

const CB_QUERY_REGEXP = /(?<chatId>\w+)(\/)(?<method>\w+)(\/)?(?<data>\w+)?/;

@Injectable()
export class BotService {
  private readonly bot: TelegramBot;
  private readonly pQueue: PQueue;
  private readonly logger = new Logger(BotService.name);
  private readonly groupManager: GroupManagerService;
  private readonly minSupportedPeriodCode = this.configService.get(
    'MIN_SUPPORTED_PERIOD_CODE',
  );

  constructor(
    private readonly configService: ConfigService,
    private readonly accountsService: AccountsService,
    private readonly appartmentsService: AppartmentsService,
    private readonly accrualsService: AccrualsService,
    private readonly invoiceService: InvoiceService,
  ) {
    this.bot = this.setupBot();
    this.groupManager = this.setupGroupManager();
    this.pQueue = new PQueue({
      concurrency: 1,
      interval: 3000,
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

  private setupGroupManager() {
    const groupChatId = this.configService.get<number>(
      'TELEGRAM_GROUP_CHAT_ID',
    );

    if (!groupChatId) {
      const envError = 'TELEGRAM_GROUP_CHAT_ID is not specified in environment';
      this.logger.error(envError);
      throw new Error(envError);
    }

    return new GroupManagerService(this.bot, this.pQueue, groupChatId);
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
              text: 'Обновить квартиры',
              callback_data: `${chatId}/UpdateAppartments`,
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

    const appartmentsList = await this.appartmentsService.getAppartmentsList();
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

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  private async onUpdateInvoices(props?: UpdateInvoicesProps) {
    this.logger.log('Udating invoices...');

    const groupChatId = this.getGroupChatId();
    const chatId = props?.chatId ?? groupChatId;

    if (!chatId) {
      this.logger.error(
        'Error while updating invoices: "chatId" is not specified',
      );
      return;
    }

    const appartmentsList = await this.appartmentsService.getAppartmentsList();

    this.logger.log(
      'Appartments found: \n' +
        appartmentsList.map((appartment) => appartment.address + '\n'),
    );

    const newInvoices: Record<string, string>[] = [];

    for (const appartment of appartmentsList) {
      const accounts = await this.accountsService.getAccountsForAppartment(
        appartment._id,
      );

      this.logger.log(
        `Accounts found for appartment ${appartment.address}:\n` +
          accounts.map((account) => account.organizationName + '\n'),
      );

      for await (const account of accounts) {
        await this.accrualsService.updateAccrualsForAccount(account._id);
        const accountAccruals =
          await this.accrualsService.getAccrualsForAccount(account._id);

        for await (const accrual of accountAccruals) {
          if (accrual.periodId < this.minSupportedPeriodCode) {
            continue;
          }

          const isInvoiceDownloaded =
            await this.invoiceService.checkIsInvoiceDownloaded(
              accrual.appartmentId,
              accrual.accountId,
              accrual.periodId,
            );

          if (!isInvoiceDownloaded && accrual.invoiceExists) {
            this.logger.log(`Found new invoice for ${appartment.address}!`);
            const invoice = await this.invoiceService.fetchInvoiceForPeriod(
              accrual.accountId,
              accrual.periodId,
            );
            const { invoicePath, separatedPeriodCode } =
              await this.invoiceService.makeInvoicePath(
                accrual.appartmentId,
                accrual.accountId,
                accrual.periodId,
              );
            await this.invoiceService.saveInvoice(invoice, invoicePath);
            newInvoices.push({
              invoicePath,
              separatedPeriodCode,
              address: appartment.address,
            });
          }
        }
      }
    }

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
        await this.sendInvoice(
          groupChatId,
          invoicePath,
          address,
          separatedPeriodCode,
        );
      }
    }

    this.logger.log('Invoices are updated!');
    await this.sendMessage(chatId, 'Квитанции обновлены.');
  }

  private async onUpdateAppartments(props: UpdateAppartmentsProps) {
    const { chatId } = props;
    await this.appartmentsService.updateAppartmentsList();
    await this.sendMessage(
      chatId,
      `Квартиры синхронизированы с сервисом Квартплата онлайн.`,
    );
  }

  private async onGetPeriod(props: GetPeriodProps) {
    const { chatId, data: appartmentId } = props;
    const accruals = await this.accrualsService.getAccrualsForAppartment(
      appartmentId,
    );
    const accounts = await this.accountsService.getAccountsForAppartment(
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

    const appartment = await this.appartmentsService.getAppartmentById(
      appartmentId,
    );

    if (!appartment) {
      return this.logger.error(
        `Error while getting appartment: no appartment found by given id: ${appartmentId}`,
      );
    }

    const isInvoiceDownloaded =
      await this.invoiceService.checkIsInvoiceDownloaded(
        appartmentId,
        accountId,
        periodCode,
      );

    if (!isInvoiceDownloaded) {
      await this.invoiceService.downloadInvoice(
        appartmentId,
        accountId,
        periodCode,
      );
    }

    const { invoicePath, separatedPeriodCode } =
      await this.invoiceService.makeInvoicePath(
        appartmentId,
        accountId,
        periodCode,
      );

    await this.sendInvoice(
      chatId,
      invoicePath,
      appartment.address,
      separatedPeriodCode,
    );
  }

  private async sendInvoice(
    chatId: number,
    invoicePath: string,
    address: string,
    separatedPeriodCode: string,
  ) {
    this.logger.log(
      `Sending document:\nAddress: ${address}\nPeriod: ${separatedPeriodCode}\n...`,
    );

    await this.sendMessage(
      chatId,
      `Получена квитанция:\n\nАдрес:\n${address}\n\nПериод:\n${separatedPeriodCode}`,
    );
    await this.sendDocument(chatId, invoicePath);
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
