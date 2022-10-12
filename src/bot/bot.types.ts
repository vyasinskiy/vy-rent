import TelegramBot from 'node-telegram-bot-api';

export type BotHandlerProps<T> = {
  chatId: number;
  msg: TelegramBot.Message;
  data: T;
};

export type GetInvoiceProps = BotHandlerProps<string>;
export type GetPeriodProps = BotHandlerProps<string>;
export type GetAppartmentsProps = BotHandlerProps<never>;
export type UpdateInvoicesProps = BotHandlerProps<never>;
export type UpdateAppartmentsProps = BotHandlerProps<never>;
