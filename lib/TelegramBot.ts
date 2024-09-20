import { EventEmitter } from 'node:events';

import { TelegramBot as TelegramBotApi } from 'typescript-telegram-bot-api';
import { BotCommand, CallbackQuery, Message, User } from 'typescript-telegram-bot-api/dist/types';

import { TelegramBotError, TelegramBotErrorCode } from './TelegramBotError';
import { CallbackDataProvider } from './callbackData';
import { MessageResponse, ResponseToCallbackQuery, ResponseToMessage } from './response';
import { MaybePromise } from './types';
import { UserDataProvider } from './userData';
import { prepareErrorForLogging } from './utils/error';

export type MessageErrorResponseContext = {
  err: unknown;
  message: Message;
};

export type GetMessageErrorResponse<CommandType extends BaseCommand, CallbackData, UserData> = (
  ctx: MessageErrorResponseContext,
) => MaybePromise<ResponseToMessage<CommandType, CallbackData, UserData> | null | undefined | void>;

export type CallbackQueryErrorResponseContext = {
  err: unknown;
  message: Message;
  query: CallbackQuery;
};

export type GetCallbackQueryErrorResponse<CommandType extends BaseCommand, CallbackData, UserData> = (
  ctx: CallbackQueryErrorResponseContext,
) => MaybePromise<ResponseToCallbackQuery<CommandType, CallbackData, UserData> | null | undefined | void>;

export type BotCommands<CommandType extends BaseCommand> = Partial<Record<CommandType, string>>;

export type TelegramBotOptions<CommandType extends BaseCommand, CallbackData, UserData> = {
  token: string;
  commands?: BotCommands<CommandType>;
  callbackDataProvider?: CallbackDataProvider<CommandType, CallbackData, UserData>;
  usernameWhitelist?: string[];
  getMessageErrorResponse?: GetMessageErrorResponse<CommandType, CallbackData, UserData>;
  getCallbackQueryErrorResponse?: GetCallbackQueryErrorResponse<CommandType, CallbackData, UserData>;
} & ([UserData] extends [never]
  ? {
      userDataProvider?: never;
    }
  : {
      userDataProvider: UserDataProvider<CommandType, CallbackData, UserData>;
    });

export type MessageHandlerContext<CommandType extends BaseCommand, UserData> = {
  message: Message;
  userData?: UserData;
  commands: CommandType[];
};

export type MessageHandler<
  CommandType extends BaseCommand,
  CallbackData,
  UserData,
  MessageUserData extends UserData,
> = (
  ctx: MessageHandlerContext<CommandType, MessageUserData>,
) => MaybePromise<ResponseToMessage<CommandType, CallbackData, UserData> | null | undefined | void>;

export type CallbackQueryHandlerContext<UserData, QueryCallbackData> = {
  data: QueryCallbackData;
  message: Message;
  userData: UserData;
};

export type CallbackQueryHandler<
  CommandType extends BaseCommand,
  CallbackData,
  UserData,
  QueryCallbackData extends CallbackData,
> = (
  ctx: CallbackQueryHandlerContext<UserData, QueryCallbackData>,
) => MaybePromise<ResponseToCallbackQuery<CommandType, CallbackData, UserData> | null | undefined | void>;

export type BaseCommand = `/${string}`;

export type SendMessageOptions = {
  replyToMessageId?: number;
};

export type TelegramBotEvents = {
  responseError: [err: unknown];
};

export class TelegramBot<
  CommandType extends BaseCommand,
  CallbackData,
  UserData,
> extends EventEmitter<TelegramBotEvents> {
  private readonly _commandHandlers: Partial<
    Record<CommandType, MessageHandler<CommandType, CallbackData, UserData, UserData>>
  > = {};
  private readonly _getMessageErrorResponse?: GetMessageErrorResponse<CommandType, CallbackData, UserData>;
  private readonly _getCallbackQueryErrorResponse?: GetCallbackQueryErrorResponse<CommandType, CallbackData, UserData>;

  readonly api: TelegramBotApi;
  readonly commands?: BotCommands<CommandType>;
  readonly callbackDataProvider?: CallbackDataProvider<CommandType, CallbackData, UserData>;
  readonly userDataProvider?: UserDataProvider<CommandType, CallbackData, UserData>;
  readonly usernameWhitelist?: string[];

  constructor(options: TelegramBotOptions<CommandType, CallbackData, UserData>) {
    super();

    this.api = new TelegramBotApi({
      botToken: options.token,
    });
    this.commands = options.commands;
    this.callbackDataProvider = options.callbackDataProvider;
    this.userDataProvider = options.userDataProvider;
    this.usernameWhitelist = options.usernameWhitelist;
    this._getMessageErrorResponse = options.getMessageErrorResponse;
    this._getCallbackQueryErrorResponse = options.getCallbackQueryErrorResponse;
  }

  private _emitResponseError(err: unknown): void {
    if (this.listenerCount('responseError') > 0) {
      this.emit('responseError', err);
    } else {
      console.log(prepareErrorForLogging(err));
    }
  }

  async editMessage(
    message: Message,
    response: MessageResponse<CommandType, CallbackData, UserData>,
  ): Promise<Message> {
    return response.edit({
      message,
      bot: this,
    });
  }

  handleCommand(command: CommandType, handler: MessageHandler<CommandType, CallbackData, UserData, UserData>): this {
    this._commandHandlers[command] = handler;

    return this;
  }

  isUserAllowed(user: User): boolean {
    return Boolean(user.username && (!this.usernameWhitelist || this.usernameWhitelist.includes(user.username)));
  }

  async sendMessage(
    chatId: number,
    response: MessageResponse<CommandType, CallbackData, UserData>,
    options?: SendMessageOptions,
  ): Promise<Message> {
    return response.send({
      chatId,
      bot: this,
      replyToMessageId: options?.replyToMessageId,
    });
  }

  async start(): Promise<void> {
    this.api.on('message', async (message) => {
      try {
        const { from: user, text } = message;

        if (user && !this.isUserAllowed(user)) {
          return;
        }

        const userData = user && (await this.userDataProvider?.getOrCreateUserData(user.id));

        let handler: MessageHandler<CommandType, CallbackData, UserData, UserData> | null | undefined;

        if (text && text in this._commandHandlers) {
          handler = this._commandHandlers[text as CommandType];
        }

        if (userData && !handler) {
          handler = this.userDataProvider?.getUserDataHandler<UserData>(userData);
        }

        if (!handler) {
          return;
        }

        const response = await handler({
          message,
          userData,
          // TODO: fill
          commands: [],
        });

        if (response) {
          await response.respondToMessage({
            message,
            bot: this,
          });
        }
      } catch (err) {
        this._emitResponseError(err);

        try {
          const response = await this._getMessageErrorResponse?.({
            err,
            message,
          });

          await response?.respondToMessage({
            message,
            bot: this,
          });
        } catch (err) {
          this._emitResponseError(err);
        }
      }
    });

    this.api.on('callback_query', async (query) => {
      const answerQuery = async () => {
        await this.api.answerCallbackQuery({
          callback_query_id: query.id,
        });
      };

      try {
        const { from: user, message, data } = query;

        if (!message || !this.isUserAllowed(user)) {
          return await answerQuery();
        }

        // TODO: handle no data for Game
        if (data === undefined) {
          throw new TelegramBotError(TelegramBotErrorCode.UnsupportedCallbackData);
        }

        if (!this.callbackDataProvider) {
          return;
        }

        const [userData, callbackData] = await Promise.all([
          this.userDataProvider?.getOrCreateUserData(user.id),
          this.callbackDataProvider.parseCallbackData(data),
        ]);

        if (callbackData == null) {
          return await answerQuery();
        }

        const handler = this.callbackDataProvider.getCallbackQueryHandler(callbackData);

        if (!handler) {
          throw new TelegramBotError(TelegramBotErrorCode.UnsupportedCallbackData);
        }

        const response = await handler({
          data: callbackData,
          message,
          userData: userData as UserData,
        });

        if (response) {
          await response.respondToCallbackQuery({
            bot: this,
            query,
          });
        } else {
          await answerQuery();
        }
      } catch (err) {
        this._emitResponseError(err);

        if (!query.message) {
          return await answerQuery();
        }

        try {
          const response = await this._getCallbackQueryErrorResponse?.({
            err,
            message: query.message,
            query,
          });

          if (response) {
            await response.respondToCallbackQuery({
              bot: this,
              query,
            });
          } else {
            await answerQuery();
          }
        } catch (err) {
          this._emitResponseError(err);
        }
      }
    });

    await Promise.all([
      this.api.startPolling(),
      (async () => {
        if (!this.commands) {
          return;
        }

        const commandsArray: BotCommand[] = [];

        for (const command in this.commands) {
          const description = this.commands[command];

          if (description) {
            commandsArray.push({
              command,
              description,
            });
          }
        }

        await this.api.setMyCommands({
          commands: commandsArray,
        });
      })(),
    ]);
  }
}
