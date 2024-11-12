import { CallbackQuery, Message } from 'typescript-telegram-bot-api/dist/types';

import { BaseCommand, TelegramBot } from '../TelegramBot';
import { MaybePromise, RequiredKeys } from '../types';

export type ResponseOnCallbackQueryContext<
  in out CommandType extends BaseCommand,
  in out CallbackData,
  in out UserData,
> = {
  bot: TelegramBot<CommandType, CallbackData, UserData>;
  query: CallbackQuery;
};

export type ResponseOnMessageContext<in out CommandType extends BaseCommand, in out CallbackData, in out UserData> = {
  bot: TelegramBot<CommandType, CallbackData, UserData>;
  message: Message;
};

export type ResponseOnCallbackQuery<CommandType extends BaseCommand, CallbackData, UserData> = RequiredKeys<
  Response<CommandType, CallbackData, UserData>,
  'onCallbackQuery'
>;

export type ResponseOnMessage<CommandType extends BaseCommand, CallbackData, UserData> = RequiredKeys<
  Response<CommandType, CallbackData, UserData>,
  'onMessage'
>;

export type Response<in out CommandType extends BaseCommand, in out CallbackData, in out UserData> = {
  onCallbackQuery?: (ctx: ResponseOnCallbackQueryContext<CommandType, CallbackData, UserData>) => MaybePromise<void>;
  onMessage?: (ctx: ResponseOnMessageContext<CommandType, CallbackData, UserData>) => MaybePromise<void>;
};
