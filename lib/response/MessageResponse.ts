import { InlineKeyboardMarkup } from 'typescript-telegram-bot-api';

import { TelegramBotError, TelegramBotErrorCode } from '../TelegramBotError';
import { AnyUpdateContext, getUpdateContextMessage } from '../context';
import { MessageContent, MessageEffect, PreparedMessageContent, ReplyMarkup } from '../message';
import { getReplyMarkup, prepareMessageContent } from '../utils';
import { Response } from './Response';

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

export class MessageResponse implements Response {
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

  async respond(ctx: AnyUpdateContext): Promise<void> {
    const message = getUpdateContextMessage(ctx);

    if (!message) {
      return;
    }

    if (
      ctx.update.type === 'callback_query' &&
      this.mode === 'linked' &&
      (('text' in message && this.content.type === 'text') ||
        (('photo' in message ||
          'audio' in message ||
          'document' in message ||
          'video' in message ||
          'animation' in message) &&
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
      if ((this.content.type === 'location' && !this.content.point) || this.content.type === 'unmodified') {
        throw new TelegramBotError(TelegramBotErrorCode.UnsupportedContent);
      }

      await ctx.bot.sendMessage({
        content: this.content,
        chatId: message.chat.id,
        replyMarkup: this.replyMarkup,
        businessConnectionId: this.businessConnectionId,
        messageThreadId: message.message_thread_id,
        replyParameters:
          ctx.update.type !== 'callback_query' && this.mode === 'separate'
            ? undefined
            : {
                message_id: message.message_id,
                chat_id: message.chat.id,
              },
        disableNotification: this.disableNotification,
        protectContent: this.protectContent,
        allowSendingWithoutReply: this.allowSendingWithoutReply,
        messageEffect: this.messageEffect,
      });
    }

    ctx.responseSent = true;
  }
}
