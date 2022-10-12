import TelegramBot from 'node-telegram-bot-api';

export type BotHandlerProps<T> = { msg: TelegramBot.Message; data: T };

export type GetInvoiceProps = BotHandlerProps<string>;
export type GetPeriodProps = BotHandlerProps<string>;
export type UpdateInvoicesProps = BotHandlerProps<never>;
