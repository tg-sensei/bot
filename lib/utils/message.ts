import { ReadStream } from 'node:fs';

import mime from 'mime-types';
import {
  ForceReply,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from 'typescript-telegram-bot-api/dist/types';

import { InlineKeyboard } from '../InlineKeyboard';
import { Markdown } from '../Markdown';
import { ReplyKeyboard } from '../ReplyKeyboard';
import { MessageContent, MessageEffect, PreparedMessageContent, ReplyMarkup } from '../message';

const MESSAGE_EFFECT_ID_MAP: Partial<Record<string, string>> = {
  '👍': '5107584321108051014',
  '👎': '5104858069142078462',
  '❤️': '5159385139981059251',
  '🔥': '5104841245755180586',
  '🎉': '5046509860389126442',
  '💩': '5046589136895476101',
};

export function getMessageEffectId(effect?: MessageEffect): string | undefined {
  return effect && (typeof effect === 'string' ? MESSAGE_EFFECT_ID_MAP[effect] : effect.id);
}

export function getReplyMarkup(
  replyMarkup?: ReplyMarkup,
): InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply | undefined {
  return replyMarkup instanceof InlineKeyboard || replyMarkup instanceof ReplyKeyboard
    ? replyMarkup.getMarkup()
    : replyMarkup;
}

export function prepareMessageContent(content: MessageContent): PreparedMessageContent {
  if (typeof content === 'string' || content instanceof Markdown) {
    return {
      type: 'text',
      text: content,
    };
  }

  if (content instanceof ReadStream) {
    const path = content.path.toString();
    const type = mime.lookup(path);

    if (typeof type === 'string' && type.startsWith('image')) {
      return {
        type: 'photo',
        photo: content,
      };
    }

    if (typeof type === 'string' && type.startsWith('audio')) {
      return {
        type: 'audio',
        audio: content,
      };
    }

    if (typeof type === 'string' && type.startsWith('video')) {
      return {
        type: 'video',
        video: content,
      };
    }

    return {
      type: 'document',
      document: content,
    };
  }

  return content;
}
