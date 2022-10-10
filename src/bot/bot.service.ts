import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import TelegramBot from 'node-telegram-bot-api';
import PQueue from 'p-queue';
import { AccountsService } from 'src/accounts/accounts.service';
import { AccrualsService } from 'src/accruals/accruals.service';
import { AppartmentsService } from 'src/appartments/appartments.service';
import { BotCommands, MIN_SUPPORTED_PERIOD_CODE } from 'src/assets/constants';
import { InvoiceService } from 'src/invoices/invoices.service';
import { Stream } from 'stream';

const CB_QUERY_REGEXP = /(?<method>\w+)(\/)?(?<data>\w+)?/;

@Injectable()
export class BotService {
  private readonly bot: TelegramBot | null;
  private readonly groupChatId: number;
  private readonly pQueue: PQueue;

  constructor(
    private readonly configService: ConfigService,
    private readonly accountsService: AccountsService,
    private readonly appartmentsService: AppartmentsService,
    private readonly accrualsService: AccrualsService,
    private readonly invoiceService: InvoiceService,
  ) {
    this.bot = new TelegramBot(this.configService.get('TELEGRAM_API_TOKEN'), {
      polling: true,
    });
    this.groupChatId = this.configService.get('TELEGRAM_GROUP_CHAT_ID');
    this.pQueue = new PQueue({
      concurrency: 1,
      interval: 3000,
      intervalCap: 1,
    });
    this.setup();
  }

  setup() {
    this.bot.on('message', this.handleMessage);
    this.bot.on('callback_query', this.handleCallbackQuery);
  }

  sendMessage = async (
    text: string,
    options?: TelegramBot.SendMessageOptions,
  ) => {
    this.pQueue.add(() =>
      this.bot.sendMessage(this.groupChatId, text, options),
    );
  };

  sendDocument = async (
    doc: string | Stream | Buffer,
    options?: TelegramBot.SendDocumentOptions,
    fileOptions?: TelegramBot.FileOptions,
  ) => {
    this.pQueue.add(() =>
      this.bot.sendDocument(this.groupChatId, doc, options, fileOptions),
    );
  };

  handleCallbackQuery = async (msg: TelegramBot.CallbackQuery) => {
    console.log('Received callback query:', msg);

    const match = msg.data.match(CB_QUERY_REGEXP);
    const method = match.groups.method;
    const data = match.groups.data;
    this[`on${method}`](data);
  };

  sendInvoice = async (
    invoicePath: string,
    address: string,
    separatedPeriodCode: string,
  ) => {
    console.log(
      `Sending document:\nAddress: ${address}\nPeriod: ${separatedPeriodCode}\n...`,
    );

    await this.sendMessage(
      `Получена квитанция:\n\nАдрес:\n${address}\n\nПериод:\n${separatedPeriodCode}`,
    );
    await this.sendDocument(invoicePath);
  };

  handleMessage = async (msg: TelegramBot.Message) => {
    console.log('Received message:', msg);

    if (msg.text !== BotCommands.Start) {
      return;
    }

    this.onStart();
  };

  async onStart() {
    await this.sendMessage('Что нужно сделать?', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Получить счет', callback_data: 'GetAppartments' },
            { text: 'Обновить квартиры', callback_data: 'UpdateAppartments' },
            { text: 'Обновить инвойсы', callback_data: 'UpdateInvoices' },
          ],
        ],
      },
    });
  }

  async onGetAppartments() {
    const appartmentsList = await this.appartmentsService.getAppartmentsList();
    const keyboardOptions = appartmentsList.map((appartment) => [
      {
        text: appartment.address.replace('г Краснодар, ', ''),
        callback_data: `GetPeriod/${appartment._id}`,
      },
    ]);
    await this.sendMessage('По какой квартире?', {
      reply_markup: {
        inline_keyboard: keyboardOptions,
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async onUpdateInvoices() {
    console.log('Udating invoices...');
    const appartmentsList = await this.appartmentsService.getAppartmentsList();
    console.log(
      'Appartments found: \n' +
        appartmentsList.map((appartment) => appartment.address + '\n'),
    );

    const newInvoices = [];

    for (const appartment of appartmentsList) {
      const accounts = await this.accountsService.getAccountsForAppartment(
        appartment._id,
      );

      console.log(
        `Accounts found for appartment ${appartment.address}:\n` +
          accounts.map((account) => account.organizationName + '\n'),
      );

      for await (const account of accounts) {
        await this.accrualsService.updateAccrualsForAccount(account._id);
        const accountAccruals =
          await this.accrualsService.getAccrualsForAccount(account._id);

        for await (const accrual of accountAccruals) {
          if (accrual.periodId < MIN_SUPPORTED_PERIOD_CODE) {
            continue;
          }

          const isInvoiceDownloaded =
            await this.invoiceService.checkIsInvoiceDownloaded(
              accrual.appartmentId,
              accrual.accountId,
              accrual.periodId,
            );

          if (!isInvoiceDownloaded && accrual.invoiceExists) {
            console.log(`Found new invoice for ${appartment.address}!`);
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

    if (newInvoices.length === 0) {
      return await this.sendMessage('Today new invoices not found ;(');
    }

    for await (const {
      invoicePath,
      address,
      separatedPeriodCode,
    } of newInvoices) {
      await this.sendInvoice(invoicePath, address, separatedPeriodCode);
    }
    console.log('Invoices are updated!');
    await this.sendMessage('Квитанции обновлены.');
  }

  async onUpdateAppartments() {
    await this.appartmentsService.updateAppartmentsList();
    await this.sendMessage(
      `Квартиры синхронизированы с сервисом Квартплата онлайн.`,
    );
  }

  async onGetPeriod(appartmentId: string) {
    const accruals = await this.accrualsService.getAccrualsForAppartment(
      appartmentId,
    );
    const accounts = await this.accountsService.getAccountsForAppartment(
      appartmentId,
    );
    const keyboardOptions = accruals.reduce(
      (keyboardOptions, accrual, accrualIndex) => {
        if (!accrual.invoiceExists) {
          return keyboardOptions;
        }

        if (accrual.periodId < MIN_SUPPORTED_PERIOD_CODE) {
          return keyboardOptions;
        }

        const hasMultipleAccrualForCurrentPeriod = accruals.find(
          (item, itemIndex) =>
            Boolean(
              itemIndex !== accrualIndex && item.periodId === accrual.periodId,
            ),
        );

        const { organizationName } = accounts.find(
          (account) => +account.id === accrual.accountId,
        );

        const buttonText = hasMultipleAccrualForCurrentPeriod
          ? `${accrual.periodName}, ${organizationName}`
          : accrual.periodName;

        return [
          ...keyboardOptions,
          [
            {
              text: buttonText,
              callback_data: `GetInvoice/${accrual.appartmentId}_${accrual.accountId}_${accrual.periodId}
            }`,
            },
          ],
        ];
      },
      [],
    );

    await this.sendMessage('Какой период?', {
      reply_markup: {
        inline_keyboard: keyboardOptions,
      },
    });
  }

  async onGetInvoice(invoiceStringData: string) {
    const match = invoiceStringData.match(
      /(?<appartmentId>\w+)_(?<accountId>\w+)_(?<periodCode>\w+)/,
    );
    const { appartmentId, accountId, periodCode } = match.groups;

    const appartment = await this.appartmentsService.getAppartmentById(
      appartmentId,
    );

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
      invoicePath,
      appartment.address,
      separatedPeriodCode,
    );
  }
}
