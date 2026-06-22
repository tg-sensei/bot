import {
  ForceReply,
  InlineKeyboardMarkup,
  InputFile,
  InputMediaAudio,
  InputMediaDocument,
  InputMediaPhoto,
  InputMediaVideo,
  InputPaidMedia,
  LinkPreviewOptions,
  Message,
  ParseMode,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  ReplyParameters,
} from 'typescript-telegram-bot-api';

import { Markdown } from '../Markdown';
import { ReplyKeyboard } from '../ReplyKeyboard';
import { BaseCommand, TelegramBot } from '../TelegramBot';
import { TelegramBotError, TelegramBotErrorCode } from '../TelegramBotError';
import { InlineKeyboard } from '../inlineKeyboard';
import { isArray, prepareInlineKeyboard } from '../utils';
import { Action, ActionOnCallbackQueryContext, ActionOnMessageContext } from './Action';

export type EditMessageContext<CommandType extends BaseCommand, CallbackData, UserData> = {
  bot: TelegramBot<CommandType, CallbackData, UserData>;
  message: Message;
};

export type SendMessageContext<CommandType extends BaseCommand, CallbackData, UserData> = {
  bot: TelegramBot<CommandType, CallbackData, UserData>;
  chatId: number;
  businessConnectionId?: string;
  messageThreadId?: number;
  replyParameters?: ReplyParameters;
  disableNotification?: boolean;
  protectContent?: boolean;
  allowSendingWithoutReply?: boolean;
  messageEffect?: MessageEffect;
};

export type ReplyMarkup<CallbackData> =
  | InlineKeyboard<CallbackData>
  | ReplyKeyboard
  | InlineKeyboardMarkup
  | ReplyKeyboardMarkup
  | ReplyKeyboardRemove
  | ForceReply;

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type MessageActionTextContent = {
  type: 'text';
  text: string | Markdown;
  parseMode?: ParseMode;
  linkPreviewOptions?: LinkPreviewOptions;
};

export type MessageActionPhotoContent = {
  type: 'photo';
  photo: InputFile | string;
  text?: string | Markdown;
  parseMode?: ParseMode;
  showCaptionAboveMedia?: boolean;
  hasSpoiler?: boolean;
};

export type MessageActionAudioContent = {
  type: 'audio';
  audio: InputFile | string;
  duration?: number;
  performer?: string;
  title?: string;
  thumbnail?: InputFile | string;
  text?: string | Markdown;
  parseMode?: ParseMode;
};

export type MessageActionDocumentContent = {
  type: 'document';
  document: InputFile | string;
  thumbnail?: InputFile | string;
  text?: string | Markdown;
  parseMode?: ParseMode;
  disableContentTypeDetection?: boolean;
};

export type MessageActionVideoContent = {
  type: 'video';
  video: InputFile | string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnail?: InputFile | string;
  text?: string | Markdown;
  parseMode?: ParseMode;
  showCaptionAboveMedia?: boolean;
  hasSpoiler?: boolean;
  supportsStreaming?: boolean;
};

export type MessageActionAnimationContent = {
  type: 'animation';
  animation: InputFile | string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnail?: InputFile | string;
  text?: string | Markdown;
  parseMode?: ParseMode;
  showCaptionAboveMedia?: boolean;
  hasSpoiler?: boolean;
};

export type MessageActionVoiceContent = {
  type: 'voice';
  voice: InputFile | string;
  duration?: number;
  text?: string | Markdown;
  parseMode?: ParseMode;
};

export type MessageActionVideoNoteContent = {
  type: 'videoNote';
  videoNote: InputFile | string;
  duration?: number;
  length?: number;
  thumbnail?: InputFile | string;
};

export type MessageActionPaidMediaContent = {
  type: 'paidMedia';
  starCount: number;
  media: InputPaidMedia[];
  payload?: string;
  showCaptionAboveMedia?: boolean;
};

export type MessageActionMediaGroupContent = {
  type: 'mediaGroup';
  media: (InputMediaAudio | InputMediaDocument | InputMediaPhoto | InputMediaVideo)[];
};

export type MessageActionLocationContent = {
  type: 'location';
  point: GeoPoint | null;
  horizontalAccuracy?: number;
  livePeriod?: number;
  heading?: number;
  proximityAlertRadius?: number;
};

export type MessageActionVenueContent = {
  type: 'venue';
  point: GeoPoint;
  title: string;
  address: string;
  foursquareId?: string;
  foursquareType?: string;
  googlePlaceId?: string;
  googlePlaceType?: string;
};

export type MessageActionContactContent = {
  type: 'contact';
  phoneNumber: string;
  firstName: string;
  lastName?: string;
  vcard?: string;
};

export type MessageActionDiceContent = {
  type: 'dice';
  emoji?: '🎲' | '🎯' | '🏀' | '⚽' | '🎳' | '🎰';
};

export type InputPollOption =
  | string
  | Markdown
  | {
      text: string | Markdown;
      parseMode?: ParseMode;
    };

export type MessageActionPollContent = {
  type: 'poll';
  pollType?: 'quiz' | 'regular';
  question: string | Markdown;
  questionParseMode?: ParseMode;
  options: InputPollOption[];
  isAnonymous?: boolean;
  allowsMultipleAnswers?: boolean;
  correctOptionIds?: number[];
  explanation?: string | Markdown;
  explanationParseMode?: ParseMode;
  openPeriod?: number;
  closeDate?: number | Date;
  isClosed?: boolean;
};

export type MessageActionStickerContent = {
  type: 'sticker';
  sticker: InputFile | string;
};

export type MessageActionUnmodifiedContent = {
  type: 'unmodified';
};

// TODO: add string/Markdown content (simple text)
export type MessageActionContent =
  | MessageActionTextContent
  | MessageActionPhotoContent
  | MessageActionAudioContent
  | MessageActionDocumentContent
  | MessageActionVideoContent
  | MessageActionAnimationContent
  | MessageActionVoiceContent
  | MessageActionVideoNoteContent
  | MessageActionPaidMediaContent
  | MessageActionMediaGroupContent
  | MessageActionLocationContent
  | MessageActionVenueContent
  | MessageActionContactContent
  | MessageActionDiceContent
  | MessageActionPollContent
  | MessageActionStickerContent
  | MessageActionUnmodifiedContent;

export type MessageActionMode = 'linked' | 'separate';

export type MessageEffect = '👍' | '👎' | '❤️' | '🔥' | '🎉' | '💩' | { id: string };

export type MessageActionOptions<CallbackData> = {
  content: MessageActionContent;
  mode?: MessageActionMode;
  businessConnectionId?: string;
  disableNotification?: boolean;
  replyMarkup?: ReplyMarkup<CallbackData>;
  protectContent?: boolean;
  allowSendingWithoutReply?: boolean;
  messageEffect?: MessageEffect;
};

const MESSAGE_EFFECT_ID_MAP: Partial<Record<string, string>> = {
  '👍': '5107584321108051014',
  '👎': '5104858069142078462',
  '❤️': '5159385139981059251',
  '🔥': '5104841245755180586',
  '🎉': '5046509860389126442',
  '💩': '5046589136895476101',
};

/* eslint-disable brace-style */
export class MessageAction<CommandType extends BaseCommand = never, CallbackData = never, UserData = never>
  implements Action<CommandType, CallbackData, UserData>
{
  /* eslint-enable brace-style */
  readonly content: MessageActionContent;
  readonly mode: MessageActionMode;
  readonly businessConnectionId?: string;
  readonly disableNotification?: boolean;
  readonly replyMarkup?: ReplyMarkup<CallbackData>;
  readonly protectContent?: boolean;
  readonly allowSendingWithoutReply?: boolean;
  readonly messageEffect?: MessageEffect;

  constructor(options: MessageActionOptions<CallbackData>) {
    this.content = options.content;
    this.mode = options.mode ?? 'linked';
    this.businessConnectionId = options?.businessConnectionId;
    this.disableNotification = options?.disableNotification;
    this.replyMarkup = options?.replyMarkup;
    this.protectContent = options?.protectContent;
    this.allowSendingWithoutReply = options?.allowSendingWithoutReply;
    this.messageEffect = options?.messageEffect;
  }

  async edit(ctx: EditMessageContext<CommandType, CallbackData, UserData>): Promise<Message> {
    const editBasicOptions = {
      chat_id: ctx.message.chat.id,
      message_id: ctx.message.message_id,
      business_connection_id: this.businessConnectionId,
      reply_markup: await this.getInlineKeyboardReplyMarkup(ctx.bot),
    };
    const { content } = this;

    let editedMessage: Message | true | undefined;

    try {
      if (content.type === 'text') {
        // TODO: if message has caption, edit caption instead

        editedMessage = await ctx.bot.api.editMessageText({
          ...editBasicOptions,
          text: content.text.toString(),
          parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
          link_preview_options: content.linkPreviewOptions,
        });
      } else if (content.type === 'photo') {
        editedMessage = await ctx.bot.api.editMessageMedia({
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
        editedMessage = await ctx.bot.api.editMessageMedia({
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
        editedMessage = await ctx.bot.api.editMessageMedia({
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
        editedMessage = await ctx.bot.api.editMessageMedia({
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
        editedMessage = await ctx.bot.api.editMessageMedia({
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
          editedMessage = await ctx.bot.api.editMessageLiveLocation({
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
          editedMessage = await ctx.bot.api.stopMessageLiveLocation(editBasicOptions);
        }
      } else if (content.type === 'unmodified') {
        editedMessage = await ctx.bot.api.editMessageReplyMarkup(editBasicOptions);
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

  async getInlineKeyboardReplyMarkup(
    bot: TelegramBot<CommandType, CallbackData, UserData>,
  ): Promise<InlineKeyboardMarkup | undefined> {
    if (isArray(this.replyMarkup)) {
      return await prepareInlineKeyboard(bot.callbackDataProvider, this.replyMarkup);
    }

    return this.replyMarkup && 'inline_keyboard' in this.replyMarkup ? this.replyMarkup : undefined;
  }

  getMessageEffectId(messageEffect?: MessageEffect): string | undefined {
    const effect = messageEffect ?? this.messageEffect;

    return effect && (typeof effect === 'string' ? MESSAGE_EFFECT_ID_MAP[effect] : effect.id);
  }

  async getReplyMarkup(
    bot: TelegramBot<CommandType, CallbackData, UserData>,
  ): Promise<InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply | undefined> {
    return (
      this.replyMarkup &&
      (isArray(this.replyMarkup)
        ? await prepareInlineKeyboard(bot.callbackDataProvider, this.replyMarkup)
        : this.replyMarkup instanceof ReplyKeyboard
          ? this.replyMarkup.getMarkup()
          : this.replyMarkup)
    );
  }

  async onCallbackQuery(ctx: ActionOnCallbackQueryContext<CommandType, CallbackData, UserData>): Promise<void> {
    const { id: queryId, message } = ctx.query;

    if (!message) {
      return;
    }

    try {
      if (this.mode === 'separate') {
        await this.send({
          bot: ctx.bot,
          chatId: message.chat.id,
          messageThreadId: 'message_thread_id' in message ? message.message_thread_id : undefined,
          replyParameters: {
            message_id: message.message_id,
            chat_id: message.chat.id,
          },
        });
      } else {
        await this.edit({
          bot: ctx.bot,
          message,
        });
      }
    } catch (err) {
      if (err instanceof TelegramBotError && err.code === TelegramBotErrorCode.EditSameContent) {
        await ctx.bot.api.answerCallbackQuery({
          callback_query_id: queryId,
        });
      } else {
        throw err;
      }
    }
  }

  async onMessage(ctx: ActionOnMessageContext<CommandType, CallbackData, UserData>): Promise<void> {
    await this.send({
      bot: ctx.bot,
      chatId: ctx.message.chat.id,
      messageThreadId: ctx.message.message_thread_id,
      replyParameters:
        this.mode === 'separate'
          ? undefined
          : {
              message_id: ctx.message.message_id,
              chat_id: ctx.message.chat.id,
            },
    });
  }

  async send(ctx: SendMessageContext<CommandType, CallbackData, UserData>): Promise<Message[]> {
    const sendBasicOptions = {
      chat_id: ctx.chatId,
      business_connection_id: ctx.businessConnectionId ?? this.businessConnectionId,
      message_thread_id: ctx.messageThreadId,
      disable_notification: ctx.disableNotification ?? this.disableNotification,
      reply_parameters: ctx.replyParameters,
      reply_markup: await this.getReplyMarkup(ctx.bot),
      protect_content: ctx.protectContent ?? this.protectContent,
      allow_sending_without_reply: ctx.allowSendingWithoutReply ?? this.allowSendingWithoutReply,
      message_effect_id: this.getMessageEffectId(ctx.messageEffect),
    };
    const { content } = this;

    if (content.type === 'text') {
      // TODO: split into multiple messages if needed

      return [
        await ctx.bot.api.sendMessage({
          ...sendBasicOptions,
          text: content.text.toString(),
          parse_mode: content.text instanceof Markdown ? 'MarkdownV2' : content.parseMode,
          link_preview_options: content.linkPreviewOptions,
        }),
      ];
    }

    if (content.type === 'photo') {
      return [
        await ctx.bot.api.sendPhoto({
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
        await ctx.bot.api.sendAudio({
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
        await ctx.bot.api.sendDocument({
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
        await ctx.bot.api.sendVideo({
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
        await ctx.bot.api.sendAnimation({
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
        await ctx.bot.api.sendVoice({
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
        await ctx.bot.api.sendVideoNote({
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
        await ctx.bot.api.sendPaidMedia({
          ...sendBasicOptions,
          star_count: content.starCount,
          media: content.media,
          payload: content.payload,
          show_caption_above_media: content.showCaptionAboveMedia,
        }),
      ];
    }

    if (content.type === 'mediaGroup') {
      return ctx.bot.api.sendMediaGroup({
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
        await ctx.bot.api.sendLocation({
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
        await ctx.bot.api.sendVenue({
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
        await ctx.bot.api.sendContact({
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
        await ctx.bot.api.sendDice({
          ...sendBasicOptions,
          emoji: content.emoji,
        }),
      ];
    }

    if (content.type === 'poll') {
      return [
        await ctx.bot.api.sendPoll({
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
          correct_option_ids: content.correctOptionIds,
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
        await ctx.bot.api.sendSticker({
          ...sendBasicOptions,
          sticker: content.sticker,
        }),
      ];
    }

    throw new TelegramBotError(TelegramBotErrorCode.UnsupportedContent);
  }
}
