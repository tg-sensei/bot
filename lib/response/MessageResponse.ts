import { InlineKeyboardMarkup, Message, ReplyParameters } from 'typescript-telegram-bot-api/dist/types';

import { BaseCommand, TelegramBot } from '../TelegramBot';
import { TelegramBotError, TelegramBotErrorCode } from '../TelegramBotError';
import { MessageContent, MessageEffect, PreparedMessageContent, ReplyMarkup } from '../message';
import { getReplyMarkup, prepareMessageContent } from '../utils';
import { Response, ResponseOnCallbackQueryContext, ResponseOnMessageContext } from './Response';

type SendOptions<CommandType extends BaseCommand, CallbackData, UserData> = {
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

export type MessageResponseMode = 'linked' | 'separate';

export type MessageResponseOptions = {
  content: MessageContent;
  mode?: MessageResponseMode;
  businessConnectionId?: string;
  disableNotification?: boolean;
  replyMarkup?: ReplyMarkup;
  protectContent?: boolean;
  allowSendingWithoutReply?: boolean;
  messageEffect?: MessageEffect;
};

/* eslint-disable brace-style */
export class MessageResponse<CommandType extends BaseCommand = never, CallbackData = never, UserData = never>
  implements Response<CommandType, CallbackData, UserData>
{
  /* eslint-enable brace-style */
  readonly content: PreparedMessageContent;
  readonly mode: MessageResponseMode;
  readonly businessConnectionId?: string;
  readonly disableNotification?: boolean;
  readonly replyMarkup?: ReplyMarkup;
  readonly protectContent?: boolean;
  readonly allowSendingWithoutReply?: boolean;
  readonly messageEffect?: MessageEffect;

  constructor(options: MessageResponseOptions) {
    this.content = prepareMessageContent(options.content);
    this.mode = options.mode ?? 'linked';
    this.businessConnectionId = options?.businessConnectionId;
    this.disableNotification = options?.disableNotification;
    this.replyMarkup = options?.replyMarkup;
    this.protectContent = options?.protectContent;
    this.allowSendingWithoutReply = options?.allowSendingWithoutReply;
    this.messageEffect = options?.messageEffect;
  }

  private getInlineKeyboardReplyMarkup(): InlineKeyboardMarkup | undefined {
    const preparedReplyMarkup = getReplyMarkup(this.replyMarkup);

    return preparedReplyMarkup && 'inline_keyboard' in preparedReplyMarkup ? preparedReplyMarkup : undefined;
  }

  async onCallbackQuery(ctx: ResponseOnCallbackQueryContext<CommandType, CallbackData, UserData>): Promise<void> {
    const { id: queryId, message } = ctx.query;

    if (!message) {
      return;
    }

    try {
      if (
        this.mode === 'linked' &&
        (('text' in message && this.content.type === 'text') ||
          (('photo' in message || 'audio' in message || 'document' in message) &&
            (this.content.type === 'photo' ||
              this.content.type === 'audio' ||
              this.content.type === 'document' ||
              this.content.type === 'video' ||
              this.content.type === 'animation')) ||
          ('location' in message && message.location?.live_period && this.content.type === 'location') ||
          this.content.type === 'unmodified')
      ) {
        await ctx.bot.editMessage({
          chatId: message.chat.id,
          messageId: message.message_id,
          content: this.content,
          businessConnectionId: this.businessConnectionId,
          replyMarkup: this.getInlineKeyboardReplyMarkup(),
        });
      } else {
        await this.send({
          bot: ctx.bot,
          chatId: message.chat.id,
          messageThreadId: 'message_thread_id' in message ? message.message_thread_id : undefined,
          replyParameters: {
            message_id: message.message_id,
            chat_id: message.chat.id,
          },
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

  async onMessage(ctx: ResponseOnMessageContext<CommandType, CallbackData, UserData>): Promise<void> {
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

  private async send(ctx: SendOptions<CommandType, CallbackData, UserData>): Promise<Message[]> {
    if (this.content.type === 'unmodified') {
      throw new TelegramBotError(TelegramBotErrorCode.UnsupportedContent);
    }

    return ctx.bot.sendMessage({
      content: this.content,
      chatId: ctx.chatId,
      replyMarkup: this.replyMarkup,
      businessConnectionId: ctx.businessConnectionId ?? this.businessConnectionId,
      messageThreadId: ctx.messageThreadId,
      replyParameters: ctx.replyParameters,
      disableNotification: ctx.disableNotification ?? this.disableNotification,
      protectContent: ctx.protectContent ?? this.protectContent,
      allowSendingWithoutReply: ctx.allowSendingWithoutReply ?? this.allowSendingWithoutReply,
      messageEffect: ctx.messageEffect ?? this.messageEffect,
    });
  }
}
