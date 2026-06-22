import { CallbackQuery, Message } from 'typescript-telegram-bot-api';

import { BaseCommand, TelegramBot } from '../TelegramBot';
import { MaybePromise, RequiredKeys } from '../types';

export type ActionOnCallbackQueryContext<
  in out CommandType extends BaseCommand,
  in out CallbackData,
  in out UserData,
> = {
  bot: TelegramBot<CommandType, CallbackData, UserData>;
  query: CallbackQuery;
};

export type ActionOnMessageContext<in out CommandType extends BaseCommand, in out CallbackData, in out UserData> = {
  bot: TelegramBot<CommandType, CallbackData, UserData>;
  message: Message;
};

export type ActionOnCallbackQuery<CommandType extends BaseCommand, CallbackData, UserData> = RequiredKeys<
  Action<CommandType, CallbackData, UserData>,
  'onCallbackQuery'
>;

export type ActionOnMessage<CommandType extends BaseCommand, CallbackData, UserData> = RequiredKeys<
  Action<CommandType, CallbackData, UserData>,
  'onMessage'
>;

export type Action<in out CommandType extends BaseCommand, in out CallbackData, in out UserData> = {
  onCallbackQuery?: (ctx: ActionOnCallbackQueryContext<CommandType, CallbackData, UserData>) => MaybePromise<void>;
  onMessage?: (ctx: ActionOnMessageContext<CommandType, CallbackData, UserData>) => MaybePromise<void>;
};
