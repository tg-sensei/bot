import { EventEmitter } from 'node:events';
import { ReadStream, createWriteStream } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

import {
  InlineKeyboardMarkup,
  Message,
  Poll,
  ReplyParameters,
  TelegramBot as TelegramBotApi,
  UpdateType,
  User,
} from 'typescript-telegram-bot-api';

import { InlineKeyboard } from './InlineKeyboard';
import { Markdown } from './Markdown';
import { TelegramBotError, TelegramBotErrorCode } from './TelegramBotError';
import { AnyUpdate, AnyUpdateContext, UpdateTypePropertyMap } from './context';
import {
  MessageAnimationContent,
  MessageAudioContent,
  MessageContent,
  MessageDocumentContent,
  MessageEffect,
  MessageLocationContent,
  MessagePhotoContent,
  MessageStoppedLocationContent,
  MessageTextContent,
  MessageUnmodifiedContent,
  MessageVideoContent,
  ReplyMarkup,
} from './message';
import { Handler } from './middleware';
import {
  getMessageEffectId,
  getReplyMarkup,
  prepareErrorForLogging,
  prepareMessageContent,
  runHandlers,
} from './utils';
import { createInheritedObject } from './utils/object';

export type TelegramBotAgent = {
  destroy: () => void;
};

export type TelegramBotOptions = {
  token: string;
  agent?: TelegramBotAgent;
  baseURL?: string;
  allowedUpdates?: UpdateType[];
  businessConnectionId?: string;
};

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
  | MessageStoppedLocationContent
  | MessageUnmodifiedContent;

export type EditMessageOptions = {
  // TODO: make chatId: number | string; once typings are fixed
  chatId: number;
  messageId: number;
  content: EditMessageContent;
  businessConnectionId?: string;
  replyMarkup?: InlineKeyboard | InlineKeyboardMarkup;
};

export type PinChatMessageOptions = {
  chatId: number;
  messageId: number;
  businessConnectionId?: string;
  disableNotification?: boolean;
};

export type SendChatActionOptions = {
  chatId: number | string;
  messageThreadId?: number;
  businessConnectionId?: string;
  action: Parameters<TelegramBotApi['sendChatAction']>[0]['action'];
};

export type SendMessageContent = Exclude<MessageContent, MessageStoppedLocationContent | MessageUnmodifiedContent>;

export type SendMessageOptions = {
  content: SendMessageContent;
  chatId: number | string;
  replyMarkup?: ReplyMarkup;
  businessConnectionId?: string;
  messageThreadId?: number;
  replyParameters?: ReplyParameters;
  disableNotification?: boolean;
  protectContent?: boolean;
  allowSendingWithoutReply?: boolean;
  messageEffect?: MessageEffect;
};

export type StopPollOptions = {
  chatId: number | string;
  messageId: number;
  businessConnectionId?: string;
  replyMarkup?: InlineKeyboard | InlineKeyboardMarkup;
};

export type UnpinChatMessageOptions = {
  chatId: number;
  messageId: number;
  businessConnectionId?: string;
};

export type TelegramBotEvents = {
  responseError: [err: unknown];
};

export class TelegramBot extends EventEmitter<TelegramBotEvents> {
  private readonly _handlers: Handler<AnyUpdateContext>[] = [];
  private _meInfo?: User;

  readonly token: string;
  readonly baseURL: string;
  readonly businessConnectionId?: string;
  readonly api: TelegramBotApi;

  constructor(options: TelegramBotOptions) {
    super();

    this.token = options.token;
    this.baseURL = options.baseURL ?? 'https://api.telegram.org';
    this.businessConnectionId = options.businessConnectionId;
    this.api = new TelegramBotApi({
      botToken: options.token,
      agent: options.agent,
      allowedUpdates: options.allowedUpdates,
    });
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
      business_connection_id: options.businessConnectionId ?? this.businessConnectionId,
      reply_markup:
        options.replyMarkup instanceof InlineKeyboard ? options.replyMarkup.getMarkup() : options.replyMarkup,
    };
    const content = prepareMessageContent(options.content);

    let editedMessage: Message | true | undefined;

    try {
      if (content.type === 'text') {
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

  pinChatMessage(options: PinChatMessageOptions): Promise<true> {
    return this.api.pinChatMessage({
      chat_id: options.chatId,
      message_id: options.messageId,
      business_connection_id: options.businessConnectionId,
      disable_notification: options.disableNotification,
    });
  }

  async sendChatAction(options: SendChatActionOptions): Promise<true> {
    return this.api.sendChatAction({
      chat_id: options.chatId,
      message_thread_id: options.messageThreadId,
      business_connection_id: options.businessConnectionId ?? this.businessConnectionId,
      action: options.action,
    });
  }

  async sendMessage(options: SendMessageOptions): Promise<Message[]> {
    const sendBasicOptions = {
      chat_id: options.chatId,
      business_connection_id: options.businessConnectionId ?? this.businessConnectionId,
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
        throw new TelegramBotError(TelegramBotErrorCode.UnsupportedContent);
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
    const processUpdateContext = async (update: AnyUpdate) => {
      try {
        let responseSent = false;
        const ctx: AnyUpdateContext = createInheritedObject(null, {
          bot: this,
          get responseSent() {
            return responseSent;
          },
          set responseSent(value) {
            responseSent ||= value;
          },
          respondWith: async (response) => {
            await response.respond(ctx);
          },
          update,
        });

        await runHandlers(this._handlers, ctx, async () => {});
      } catch (err) {
        this._emitResponseError(err);
      }
    };

    Object.entries(UpdateTypePropertyMap).forEach(([updateType, updateProperty]) => {
      this.api.on(updateType as UpdateType, (updateValue) => {
        processUpdateContext({
          type: updateType,
          [updateProperty]: updateValue,
        } as AnyUpdate);
      });
    });

    await Promise.all([
      this.api.startPolling(),
      (async () => {
        this._meInfo = await this.api.getMe();
      })(),
    ]);
  }

  async stopPoll(options: StopPollOptions): Promise<Poll> {
    return this.api.stopPoll({
      chat_id: options.chatId,
      message_id: options.messageId,
      business_connection_id: options.businessConnectionId ?? this.businessConnectionId,
      reply_markup:
        options.replyMarkup instanceof InlineKeyboard ? options.replyMarkup.getMarkup() : options.replyMarkup,
    });
  }

  unpinChatMessage(options: UnpinChatMessageOptions): Promise<true> {
    return this.api.unpinChatMessage({
      chat_id: options.chatId,
      message_id: options.messageId,
      business_connection_id: options.businessConnectionId,
    });
  }

  use(handler: Handler<AnyUpdateContext>): this {
    this._handlers.push(handler);

    return this;
  }
}
