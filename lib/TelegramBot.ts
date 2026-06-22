import { EventEmitter } from 'node:events';
import { createWriteStream } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

import {
  BotCommand,
  CallbackQuery,
  ChatShared,
  Message,
  TelegramBot as TelegramBotApi,
  UpdateType,
  User,
  UsersShared,
} from 'typescript-telegram-bot-api';

import { TelegramBotError, TelegramBotErrorCode } from './TelegramBotError';
import { ActionOnCallbackQuery, ActionOnMessage } from './action';
import { CallbackDataProvider } from './callbackData';
import { MaybePromise } from './types';
import { UserDataProvider } from './userData';
import { isTruthy, prepareErrorForLogging } from './utils';

export type MessageErrorActionContext = {
  err: unknown;
  message: Message;
};

export type GetMessageErrorAction<CommandType extends BaseCommand, CallbackData, UserData> = (
  ctx: MessageErrorActionContext,
) => MaybePromise<ActionOnMessage<CommandType, CallbackData, UserData> | null | undefined | void>;

export type CallbackQueryErrorActionContext = {
  err: unknown;
  message: Message;
  query: CallbackQuery;
};

export type GetCallbackQueryErrorAction<CommandType extends BaseCommand, CallbackData, UserData> = (
  ctx: CallbackQueryErrorActionContext,
) => MaybePromise<ActionOnCallbackQuery<CommandType, CallbackData, UserData> | null | undefined | void>;

export type UsersSharedHandlerContext = {
  usersShared: UsersShared;
};

export type UsersSharedHandler<in out CommandType extends BaseCommand, in out CallbackData, in out UserData> = (
  ctx: UsersSharedHandlerContext,
) => MaybePromise<ActionOnMessage<CommandType, CallbackData, UserData> | null | undefined | void>;

export type ChatSharedHandlerContext = {
  chatShared: ChatShared;
};

export type ChatSharedHandler<in out CommandType extends BaseCommand, in out CallbackData, in out UserData> = (
  ctx: ChatSharedHandlerContext,
) => MaybePromise<ActionOnMessage<CommandType, CallbackData, UserData> | null | undefined | void>;

export type BotCommands<CommandType extends BaseCommand> = Partial<Record<CommandType, string>>;

export type TelegramBotAgent = {
  destroy: () => void;
};

export type TelegramBotOptions<CommandType extends BaseCommand, CallbackData, UserData> = {
  token: string;
  agent?: TelegramBotAgent;
  baseURL?: string;
  allowedUpdates?: UpdateType[];
  commands?: BotCommands<CommandType>;
  callbackDataProvider?: CallbackDataProvider<NoInfer<CommandType>, CallbackData, NoInfer<UserData>>;
  usernameWhitelist?: string[];
  getMessageErrorAction?: GetMessageErrorAction<NoInfer<CommandType>, NoInfer<CallbackData>, NoInfer<UserData>>;
  getCallbackQueryErrorAction?: GetCallbackQueryErrorAction<
    NoInfer<CommandType>,
    NoInfer<CallbackData>,
    NoInfer<UserData>
  >;
} & ([UserData] extends [never | undefined]
  ? {
      userDataProvider?: never;
    }
  : {
      userDataProvider: UserDataProvider<NoInfer<CommandType>, NoInfer<CallbackData>, UserData>;
    });

export type UserWithData<UserData> = User & {
  data: UserData;
};

export type MessageHandlerContext<CommandType extends BaseCommand, UserData, WithUser extends boolean> = {
  message: Message;
  user: WithUser extends true ? UserWithData<UserData> : undefined;
  commands: (CommandType | string)[];
};

export type MessageHandler<
  in out CommandType extends BaseCommand,
  in out CallbackData,
  in out UserData,
  MessageUserData extends UserData,
  WithUser extends boolean,
> = (
  ctx: MessageHandlerContext<CommandType, MessageUserData, WithUser>,
) => MaybePromise<ActionOnMessage<CommandType, CallbackData, UserData> | null | undefined | void>;

export type CallbackQueryHandlerContext<UserData, QueryCallbackData> = {
  data: QueryCallbackData;
  message: Message;
  user: UserWithData<UserData>;
};

export type CallbackQueryHandler<
  in out CommandType extends BaseCommand,
  in out CallbackData,
  in out UserData,
  QueryCallbackData extends CallbackData,
> = (
  ctx: CallbackQueryHandlerContext<UserData, QueryCallbackData>,
) => MaybePromise<ActionOnCallbackQuery<CommandType, CallbackData, UserData> | null | undefined | void>;

export type BaseCommand = `/${string}`;

export type DownloadFileOptions = {
  fileId: string;
  path: string;
};

export type TelegramBotEvents = {
  actionError: [err: unknown];
};

export class TelegramBot<
  in out CommandType extends BaseCommand = never,
  in out CallbackData = never,
  in out UserData = never,
> extends EventEmitter<TelegramBotEvents> {
  private readonly _commandHandlers: Partial<
    Record<CommandType, MessageHandler<CommandType, CallbackData, UserData, UserData, boolean>>
  > = {};
  private readonly _getMessageErrorAction?: GetMessageErrorAction<CommandType, CallbackData, UserData>;
  private readonly _getCallbackQueryErrorAction?: GetCallbackQueryErrorAction<CommandType, CallbackData, UserData>;
  private _messageHandler?: MessageHandler<CommandType, CallbackData, UserData, UserData, boolean>;
  private _usersSharedHandler?: UsersSharedHandler<CommandType, CallbackData, UserData>;
  private _chatSharedHandler?: ChatSharedHandler<CommandType, CallbackData, UserData>;
  private _meInfo?: User;

  readonly token: string;
  readonly baseURL: string;
  readonly api: TelegramBotApi;
  readonly commands?: BotCommands<CommandType>;
  readonly callbackDataProvider?: CallbackDataProvider<CommandType, CallbackData, UserData>;
  readonly userDataProvider?: UserDataProvider<CommandType, CallbackData, UserData>;
  readonly usernameWhitelist?: string[];

  constructor(options: TelegramBotOptions<CommandType, CallbackData, UserData>) {
    super();

    this.token = options.token;
    this.baseURL = options.baseURL ?? 'https://api.telegram.org';
    this.api = new TelegramBotApi({
      botToken: options.token,
      agent: options.agent,
      allowedUpdates: options.allowedUpdates,
    });
    this.commands = options.commands;
    this.callbackDataProvider = options.callbackDataProvider;
    this.userDataProvider = options.userDataProvider;
    this.usernameWhitelist = options.usernameWhitelist;
    this._getMessageErrorAction = options.getMessageErrorAction;
    this._getCallbackQueryErrorAction = options.getCallbackQueryErrorAction;
  }

  private _emitActionError(err: unknown): void {
    if (this.listenerCount('actionError') > 0) {
      this.emit('actionError', err);
    } else {
      console.log(prepareErrorForLogging(err));
    }
  }

  async downloadFile(options: DownloadFileOptions): Promise<void> {
    const file = await this.api.getFile({
      file_id: options.fileId,
    });

    await new Promise((resolve, reject) => {
      const url = new URL(`${this.baseURL}/file/bot${this.token}/${file.file_path}`);
      const req = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url);
      const writeStream = createWriteStream(options.path, 'utf8');

      writeStream.on('error', reject);
      writeStream.on('finish', resolve);

      req.on('error', reject);
      req.on('response', (response) => {
        response.pipe(writeStream);
      });

      req.end();
    });
  }

  handleChatShared(handler: ChatSharedHandler<CommandType, CallbackData, UserData>): this {
    this._chatSharedHandler = handler;

    return this;
  }

  handleCommand(
    command: CommandType,
    handler: MessageHandler<CommandType, CallbackData, UserData, UserData, boolean>,
  ): this {
    this._commandHandlers[command] = handler;

    return this;
  }

  handleMessage(handler: MessageHandler<CommandType, CallbackData, UserData, UserData, boolean>): this {
    this._messageHandler = handler;

    return this;
  }

  // TODO: add handleText (match: string | string[] | RegExp, callback: MessageCallback)

  handleUsersShared(handler: UsersSharedHandler<CommandType, CallbackData, UserData>): this {
    this._usersSharedHandler = handler;

    return this;
  }

  isUserAllowed(user: User): boolean {
    return Boolean(user.username && (!this.usernameWhitelist || this.usernameWhitelist.includes(user.username)));
  }

  async start(): Promise<void> {
    this.api.on('message', async (message) => {
      try {
        const { from: telegramUser, text, entities, users_shared: usersShared, chat_shared: chatShared } = message;

        if (usersShared && this._usersSharedHandler) {
          const action = await this._usersSharedHandler({
            usersShared,
          });

          await action?.onMessage({
            message,
            bot: this,
          });

          return;
        }

        if (chatShared && this._chatSharedHandler) {
          const action = await this._chatSharedHandler({
            chatShared,
          });

          await action?.onMessage({
            message,
            bot: this,
          });

          return;
        }

        if (telegramUser && !this.isUserAllowed(telegramUser)) {
          return;
        }

        const user = telegramUser && {
          ...telegramUser,
          data: (await this.userDataProvider?.getOrCreateUserData(telegramUser.id)) as UserData,
        };
        const commands =
          entities
            ?.filter(({ type }) => type === 'bot_command')
            .map(({ offset, length }) => {
              const fullCommand = text?.slice(offset, offset + length);

              if (!fullCommand) {
                return;
              }

              const split = fullCommand.split('@');
              const botUsername = split.at(1);

              if (botUsername && botUsername !== this._meInfo?.username) {
                return;
              }

              return split[0];
            })
            .filter(isTruthy) ?? [];

        let handler: MessageHandler<CommandType, CallbackData, UserData, UserData, boolean> | null | undefined;

        // TODO: add support for multiple commands
        for (const command of commands) {
          if (command in this._commandHandlers) {
            handler = this._commandHandlers[command as CommandType];
          }

          if (handler) {
            break;
          }
        }

        if (user) {
          handler ??= this.userDataProvider?.getUserDataHandler<UserData>(user.data);
        }

        handler ??= this._messageHandler;

        const action = await handler?.({
          message,
          user,
          commands,
        });

        await action?.onMessage({
          message,
          bot: this,
        });
      } catch (err) {
        this._emitActionError(err);

        try {
          const action = await this._getMessageErrorAction?.({
            err,
            message,
          });

          await action?.onMessage({
            message,
            bot: this,
          });
        } catch (err) {
          this._emitActionError(err);
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
        const { from: telegramUser, message, data } = query;

        if (!message || !this.isUserAllowed(telegramUser)) {
          return await answerQuery();
        }

        // TODO: handle no data for Game
        if (data === undefined) {
          throw new TelegramBotError(TelegramBotErrorCode.UnsupportedCallbackData);
        }

        if (!this.callbackDataProvider) {
          return;
        }

        const [user, callbackData] = await Promise.all([
          (async () => ({
            ...telegramUser,
            data: (await this.userDataProvider?.getOrCreateUserData(telegramUser.id)) as UserData,
          }))(),
          this.callbackDataProvider.parseCallbackData(data),
        ]);

        if (callbackData == null) {
          return await answerQuery();
        }

        const handler = this.callbackDataProvider.getCallbackQueryHandler(callbackData);

        if (!handler) {
          throw new TelegramBotError(TelegramBotErrorCode.UnsupportedCallbackData);
        }

        const action = await handler({
          data: callbackData,
          message,
          user,
        });

        if (action) {
          await action.onCallbackQuery({
            bot: this,
            query,
          });
        } else {
          await answerQuery();
        }
      } catch (err) {
        this._emitActionError(err);

        if (!query.message) {
          return await answerQuery();
        }

        try {
          const action = await this._getCallbackQueryErrorAction?.({
            err,
            message: query.message,
            query,
          });

          if (action) {
            await action.onCallbackQuery({
              bot: this,
              query,
            });
          } else {
            await answerQuery();
          }
        } catch (err) {
          this._emitActionError(err);
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
      (async () => {
        this._meInfo = await this.api.getMe();
      })(),
    ]);
  }
}
