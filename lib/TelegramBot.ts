import { EventEmitter } from 'node:events';
import { ReadStream, createWriteStream } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

import {
  BotCommand,
  CallbackQuery,
  ChatShared,
  InlineKeyboardMarkup,
  Message,
  ReplyParameters,
  TelegramBot as TelegramBotApi,
  UpdateType,
  User,
  UsersShared,
} from 'typescript-telegram-bot-api';

import { InlineKeyboard } from './InlineKeyboard';
import { Markdown } from './Markdown';
import { TelegramBotError, TelegramBotErrorCode } from './TelegramBotError';
import { CallbackDataProvider } from './callbackData';
import {
  MessageAnimationContent,
  MessageAudioContent,
  MessageContent,
  MessageDocumentContent,
  MessageEffect,
  MessageLocationContent,
  MessagePhotoContent,
  MessageTextContent,
  MessageUnmodifiedContent,
  MessageVideoContent,
  ReplyMarkup,
} from './message';
import { ResponseOnCallbackQuery, ResponseOnMessage } from './response';
import { MaybePromise } from './types';
import { UserDataProvider } from './userData';
import { getMessageEffectId, getReplyMarkup, isTruthy, prepareErrorForLogging, prepareMessageContent } from './utils';

export type MessageErrorResponseContext = {
  err: unknown;
  message: Message;
};

export type GetMessageErrorResponse<CommandType extends BaseCommand, CallbackData, UserData> = (
  ctx: MessageErrorResponseContext,
) => MaybePromise<ResponseOnMessage<CommandType, CallbackData, UserData> | null | undefined | void>;

export type CallbackQueryErrorResponseContext = {
  err: unknown;
  message: Message;
  query: CallbackQuery;
};

export type GetCallbackQueryErrorResponse<CommandType extends BaseCommand, CallbackData, UserData> = (
  ctx: CallbackQueryErrorResponseContext,
) => MaybePromise<ResponseOnCallbackQuery<CommandType, CallbackData, UserData> | null | undefined | void>;

export type UsersSharedHandlerContext = {
  usersShared: UsersShared;
};

export type UsersSharedHandler<in out CommandType extends BaseCommand, in out CallbackData, in out UserData> = (
  ctx: UsersSharedHandlerContext,
) => MaybePromise<ResponseOnMessage<CommandType, CallbackData, UserData> | null | undefined | void>;

export type ChatSharedHandlerContext = {
  chatShared: ChatShared;
};

export type ChatSharedHandler<in out CommandType extends BaseCommand, in out CallbackData, in out UserData> = (
  ctx: ChatSharedHandlerContext,
) => MaybePromise<ResponseOnMessage<CommandType, CallbackData, UserData> | null | undefined | void>;

export type BotCommands<CommandType extends BaseCommand> = Partial<Record<CommandType, string>>;

export type TelegramBotAgent = {
  destroy: () => void;
};

// TODO: add businessConnectionId
export type TelegramBotOptions<CommandType extends BaseCommand, CallbackData, UserData> = {
  token: string;
  agent?: TelegramBotAgent;
  baseURL?: string;
  allowedUpdates?: UpdateType[];
  commands?: BotCommands<CommandType>;
  callbackDataProvider?: CallbackDataProvider<NoInfer<CommandType>, CallbackData, NoInfer<UserData>>;
  usernameWhitelist?: string[];
  getMessageErrorResponse?: GetMessageErrorResponse<NoInfer<CommandType>, NoInfer<CallbackData>, NoInfer<UserData>>;
  getCallbackQueryErrorResponse?: GetCallbackQueryErrorResponse<
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
) => MaybePromise<ResponseOnMessage<CommandType, CallbackData, UserData> | null | undefined | void>;

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
) => MaybePromise<ResponseOnCallbackQuery<CommandType, CallbackData, UserData> | null | undefined | void>;

export type BaseCommand = `/${string}`;

export type DownloadFileOptions = {
  fileId: string;
  path: string;
};

export type EditMessageContent =
  | string
  | Markdown
  | ReadStream
  | MessageTextContent
  | MessagePhotoContent
  | MessageAudioContent
  | MessageDocumentContent
  | MessageVideoContent
  | MessageAnimationContent
  | MessageLocationContent
  | MessageUnmodifiedContent;

export type EditMessageOptions = {
  chatId: number;
  messageId: number;
  content: EditMessageContent;
  businessConnectionId?: string;
  replyMarkup?: InlineKeyboard | InlineKeyboardMarkup;
};

export type SendMessageContent = Exclude<MessageContent, MessageUnmodifiedContent>;

export type SendMessageOptions = {
  content: SendMessageContent;
  chatId: number;
  replyMarkup?: ReplyMarkup;
  businessConnectionId?: string;
  messageThreadId?: number;
  replyParameters?: ReplyParameters;
  disableNotification?: boolean;
  protectContent?: boolean;
  allowSendingWithoutReply?: boolean;
  messageEffect?: MessageEffect;
};

export type TelegramBotEvents = {
  responseError: [err: unknown];
};

export class TelegramBot<
  in out CommandType extends BaseCommand = never,
  in out CallbackData = never,
  in out UserData = never,
> extends EventEmitter<TelegramBotEvents> {
  private readonly _commandHandlers: Partial<
    Record<CommandType, MessageHandler<CommandType, CallbackData, UserData, UserData, boolean>>
  > = {};
  private readonly _getMessageErrorResponse?: GetMessageErrorResponse<CommandType, CallbackData, UserData>;
  private readonly _getCallbackQueryErrorResponse?: GetCallbackQueryErrorResponse<CommandType, CallbackData, UserData>;
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

  async editMessage(options: EditMessageOptions): Promise<Message> {
    const editBasicOptions = {
      chat_id: options.chatId,
      message_id: options.messageId,
      business_connection_id: options.businessConnectionId,
      reply_markup:
        options.replyMarkup instanceof InlineKeyboard ? options.replyMarkup.getMarkup() : options.replyMarkup,
    };
    const content = prepareMessageContent(options.content);

    let editedMessage: Message | true | undefined;

    try {
      if (content.type === 'text') {
        // TODO: if message has caption, edit caption instead

        editedMessage = await this.api.editMessageText({
          ...editBasicOptions,
          text: content.text.toString(),
          parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
          link_preview_options: content.linkPreviewOptions,
        });
      } else if (content.type === 'photo') {
        editedMessage = await this.api.editMessageMedia({
          ...editBasicOptions,
          media: {
            type: 'photo',
            media: content.photo,
            caption: content.text?.toString(),
            parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
            show_caption_above_media: content.showCaptionAboveMedia,
            has_spoiler: content.hasSpoiler,
          },
        });
      } else if (content.type === 'audio') {
        editedMessage = await this.api.editMessageMedia({
          ...editBasicOptions,
          media: {
            type: 'audio',
            media: content.audio,
            duration: content.duration,
            performer: content.performer,
            title: content.title,
            thumbnail: content.thumbnail,
            caption: content.text?.toString(),
            parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
          },
        });
      } else if (content.type === 'document') {
        editedMessage = await this.api.editMessageMedia({
          ...editBasicOptions,
          media: {
            type: 'document',
            media: content.document,
            thumbnail: content.thumbnail,
            caption: content.text?.toString(),
            parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
            disable_content_type_detection: content.disableContentTypeDetection,
          },
        });
      } else if (content.type === 'video') {
        editedMessage = await this.api.editMessageMedia({
          ...editBasicOptions,
          media: {
            type: 'video',
            media: content.video,
            duration: content.duration,
            width: content.width,
            height: content.height,
            thumbnail: content.thumbnail,
            caption: content.text?.toString(),
            parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
            show_caption_above_media: content.showCaptionAboveMedia,
            has_spoiler: content.hasSpoiler,
            supports_streaming: content.supportsStreaming,
          },
        });
      } else if (content.type === 'animation') {
        editedMessage = await this.api.editMessageMedia({
          ...editBasicOptions,
          media: {
            type: 'animation',
            media: content.animation,
            duration: content.duration,
            width: content.width,
            height: content.height,
            thumbnail: content.thumbnail,
            caption: content.text?.toString(),
            parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
            show_caption_above_media: content.showCaptionAboveMedia,
            has_spoiler: content.hasSpoiler,
          },
        });
      } else if (content.type === 'location') {
        if (content.point) {
          editedMessage = await this.api.editMessageLiveLocation({
            ...editBasicOptions,
            latitude: content.point.latitude,
            longitude: content.point.longitude,
            horizontal_accuracy: content.horizontalAccuracy,
            live_period:
              content.livePeriod === Infinity
                ? 0x7fffffff
                : typeof content.livePeriod === 'number'
                  ? content.livePeriod / 1000
                  : undefined,
            heading: content.heading,
            proximity_alert_radius: content.proximityAlertRadius,
          });
        } else {
          editedMessage = await this.api.stopMessageLiveLocation(editBasicOptions);
        }
      } else if (content.type === 'unmodified') {
        editedMessage = await this.api.editMessageReplyMarkup(editBasicOptions);
      } else {
        throw new TelegramBotError(TelegramBotErrorCode.UnsupportedContent);
      }
    } catch (err) {
      if (!(err instanceof Error) || !/message is not modified/.test(err.message)) {
        throw err;
      }
    }

    if (typeof editedMessage !== 'object') {
      throw new TelegramBotError(TelegramBotErrorCode.EditSameContent);
    }

    return editedMessage;
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

  async sendMessage(options: SendMessageOptions): Promise<Message[]> {
    const sendBasicOptions = {
      chat_id: options.chatId,
      business_connection_id: options.businessConnectionId,
      message_thread_id: options.messageThreadId,
      disable_notification: options.disableNotification,
      reply_parameters: options.replyParameters,
      reply_markup: getReplyMarkup(options.replyMarkup),
      protect_content: options.protectContent,
      allow_sending_without_reply: options.allowSendingWithoutReply,
      message_effect_id: getMessageEffectId(options.messageEffect),
    };
    const content = prepareMessageContent(options.content);

    if (content.type === 'text') {
      // TODO: split into multiple messages if needed

      return [
        await this.api.sendMessage({
          ...sendBasicOptions,
          text: content.text.toString(),
          parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
          link_preview_options: content.linkPreviewOptions,
        }),
      ];
    }

    if (content.type === 'photo') {
      return [
        await this.api.sendPhoto({
          ...sendBasicOptions,
          photo: content.photo,
          caption: content.text?.toString(),
          parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
          show_caption_above_media: content.showCaptionAboveMedia,
          has_spoiler: content.hasSpoiler,
        }),
      ];
    }

    if (content.type === 'audio') {
      return [
        await this.api.sendAudio({
          ...sendBasicOptions,
          audio: content.audio,
          duration: content.duration,
          performer: content.performer,
          title: content.title,
          thumbnail: content.thumbnail,
          caption: content.text?.toString(),
          parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
        }),
      ];
    }

    if (content.type === 'document') {
      return [
        await this.api.sendDocument({
          ...sendBasicOptions,
          document: content.document,
          thumbnail: content.thumbnail,
          caption: content.text?.toString(),
          parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
          disable_content_type_detection: content.disableContentTypeDetection,
        }),
      ];
    }

    if (content.type === 'video') {
      return [
        await this.api.sendVideo({
          ...sendBasicOptions,
          video: content.video,
          duration: content.duration,
          width: content.width,
          height: content.height,
          thumbnail: content.thumbnail,
          caption: content.text?.toString(),
          parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
          show_caption_above_media: content.showCaptionAboveMedia,
          has_spoiler: content.hasSpoiler,
          supports_streaming: content.supportsStreaming,
        }),
      ];
    }

    if (content.type === 'animation') {
      return [
        await this.api.sendAnimation({
          ...sendBasicOptions,
          animation: content.animation,
          duration: content.duration,
          width: content.width,
          height: content.height,
          thumbnail: content.thumbnail,
          caption: content.text?.toString(),
          parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
          show_caption_above_media: content.showCaptionAboveMedia,
          has_spoiler: content.hasSpoiler,
        }),
      ];
    }

    if (content.type === 'voice') {
      return [
        await this.api.sendVoice({
          ...sendBasicOptions,
          voice: content.voice,
          duration: content.duration,
          caption: content.text?.toString(),
          parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
        }),
      ];
    }

    if (content.type === 'videoNote') {
      return [
        await this.api.sendVideoNote({
          ...sendBasicOptions,
          video_note: content.videoNote,
          duration: content.duration,
          length: content.length,
          thumbnail: content.thumbnail,
        }),
      ];
    }

    if (content.type === 'paidMedia') {
      return [
        await this.api.sendPaidMedia({
          ...sendBasicOptions,
          star_count: content.starCount,
          media: content.media,
          payload: content.payload,
          show_caption_above_media: content.showCaptionAboveMedia,
        }),
      ];
    }

    if (content.type === 'mediaGroup') {
      return this.api.sendMediaGroup({
        ...sendBasicOptions,
        media: content.media,
      });
    }

    if (content.type === 'location') {
      const { point } = content;

      if (!point) {
        throw new TelegramBotError(TelegramBotErrorCode.NoLocationPoint);
      }

      return [
        await this.api.sendLocation({
          ...sendBasicOptions,
          latitude: point.latitude,
          longitude: point.longitude,
          horizontal_accuracy: content.horizontalAccuracy,
          live_period:
            content.livePeriod === Infinity
              ? 0x7fffffff
              : typeof content.livePeriod === 'number'
                ? content.livePeriod / 1000
                : undefined,
          heading: content.heading,
          proximity_alert_radius: content.proximityAlertRadius,
        }),
      ];
    }

    if (content.type === 'venue') {
      return [
        await this.api.sendVenue({
          ...sendBasicOptions,
          latitude: content.point.latitude,
          longitude: content.point.longitude,
          title: content.title,
          address: content.address,
          foursquare_id: content.foursquareId,
          foursquare_type: content.foursquareType,
          google_place_id: content.googlePlaceId,
          google_place_type: content.googlePlaceType,
        }),
      ];
    }

    if (content.type === 'contact') {
      return [
        await this.api.sendContact({
          ...sendBasicOptions,
          phone_number: content.phoneNumber,
          first_name: content.firstName,
          last_name: content.lastName,
          vcard: content.vcard,
        }),
      ];
    }

    if (content.type === 'dice') {
      return [
        await this.api.sendDice({
          ...sendBasicOptions,
          emoji: content.emoji,
        }),
      ];
    }

    if (content.type === 'poll') {
      return [
        await this.api.sendPoll({
          ...sendBasicOptions,
          question: content.question.toString(),
          question_parse_mode: content.question instanceof Markdown ? 'MarkdownV2' : content.questionParseMode,
          options: content.options.map((option) => {
            const text = typeof option === 'string' || option instanceof Markdown ? option : option.text;

            return {
              text: text.toString(),
              text_parse_mode:
                text instanceof Markdown
                  ? 'MarkdownV2'
                  : typeof option === 'object' && !(option instanceof Markdown)
                    ? option.parseMode
                    : undefined,
            };
          }),
          is_anonymous: content.isAnonymous,
          type: content.pollType,
          allows_multiple_answers: content.allowsMultipleAnswers,
          correct_option_id: content.correctOptionId,
          explanation: content.explanation?.toString(),
          explanation_parse_mode: content.explanation instanceof Markdown ? 'MarkdownV2' : content.explanationParseMode,
          open_period: typeof content.openPeriod === 'number' ? content.openPeriod / 1000 : undefined,
          close_date:
            content.closeDate instanceof Date
              ? Math.floor(content.closeDate.valueOf() / 1000)
              : typeof content.closeDate === 'number'
                ? content.closeDate / 1000
                : undefined,
          is_closed: content.isClosed,
        }),
      ];
    }

    if (content.type === 'sticker') {
      return [
        await this.api.sendSticker({
          ...sendBasicOptions,
          sticker: content.sticker,
        }),
      ];
    }

    throw new TelegramBotError(TelegramBotErrorCode.UnsupportedContent);
  }

  async start(): Promise<void> {
    this.api.on('message', async (message) => {
      try {
        const { from: telegramUser, text, entities, users_shared: usersShared, chat_shared: chatShared } = message;

        if (usersShared && this._usersSharedHandler) {
          const response = await this._usersSharedHandler({
            usersShared,
          });

          await response?.onMessage({
            message,
            bot: this,
          });

          return;
        }

        if (chatShared && this._chatSharedHandler) {
          const response = await this._chatSharedHandler({
            chatShared,
          });

          await response?.onMessage({
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

        const response = await handler?.({
          message,
          user,
          commands,
        });

        await response?.onMessage({
          message,
          bot: this,
        });
      } catch (err) {
        this._emitResponseError(err);

        try {
          const response = await this._getMessageErrorResponse?.({
            err,
            message,
          });

          await response?.onMessage({
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

        const response = await handler({
          data: callbackData,
          message,
          user,
        });

        if (response) {
          await response.onCallbackQuery({
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
            await response.onCallbackQuery({
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
      (async () => {
        this._meInfo = await this.api.getMe();
      })(),
    ]);
  }
}
