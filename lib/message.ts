import { ReadStream } from 'node:fs';

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
  ParseMode,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from 'typescript-telegram-bot-api/dist/types';

import { InlineKeyboard } from './InlineKeyboard';
import { Markdown } from './Markdown';
import { ReplyKeyboard } from './ReplyKeyboard';

export type MessageTextContent = {
  type: 'text';
  text: string | Markdown;
  parseMode?: ParseMode;
  linkPreviewOptions?: LinkPreviewOptions;
};

export type MessagePhotoContent = {
  type: 'photo';
  photo: InputFile | string;
  text?: string | Markdown;
  parseMode?: ParseMode;
  showCaptionAboveMedia?: boolean;
  hasSpoiler?: boolean;
};

export type MessageAudioContent = {
  type: 'audio';
  audio: InputFile | string;
  duration?: number;
  performer?: string;
  title?: string;
  thumbnail?: InputFile | string;
  text?: string | Markdown;
  parseMode?: ParseMode;
};

export type MessageDocumentContent = {
  type: 'document';
  document: InputFile | string;
  thumbnail?: InputFile | string;
  text?: string | Markdown;
  parseMode?: ParseMode;
  disableContentTypeDetection?: boolean;
};

export type MessageVideoContent = {
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

export type MessageAnimationContent = {
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

export type MessageVoiceContent = {
  type: 'voice';
  voice: InputFile | string;
  duration?: number;
  text?: string | Markdown;
  parseMode?: ParseMode;
};

export type MessageVideoNoteContent = {
  type: 'videoNote';
  videoNote: InputFile | string;
  duration?: number;
  length?: number;
  thumbnail?: InputFile | string;
};

export type MessagePaidMediaContent = {
  type: 'paidMedia';
  starCount: number;
  media: InputPaidMedia[];
  payload?: string;
  showCaptionAboveMedia?: boolean;
};

export type MessageMediaGroupContent = {
  type: 'mediaGroup';
  media: (InputMediaAudio | InputMediaDocument | InputMediaPhoto | InputMediaVideo)[];
};

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type MessageLocationContent = {
  type: 'location';
  point: GeoPoint | null;
  horizontalAccuracy?: number;
  livePeriod?: number;
  heading?: number;
  proximityAlertRadius?: number;
};

export type MessageVenueContent = {
  type: 'venue';
  point: GeoPoint;
  title: string;
  address: string;
  foursquareId?: string;
  foursquareType?: string;
  googlePlaceId?: string;
  googlePlaceType?: string;
};

export type MessageContactContent = {
  type: 'contact';
  phoneNumber: string;
  firstName: string;
  lastName?: string;
  vcard?: string;
};

export type MessageDiceContent = {
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

export type MessagePollContent = {
  type: 'poll';
  pollType?: 'quiz' | 'regular';
  question: string | Markdown;
  questionParseMode?: ParseMode;
  options: InputPollOption[];
  isAnonymous?: boolean;
  allowsMultipleAnswers?: boolean;
  correctOptionId?: number;
  explanation?: string | Markdown;
  explanationParseMode?: ParseMode;
  openPeriod?: number;
  closeDate?: number | Date;
  isClosed?: boolean;
};

export type MessageStickerContent = {
  type: 'sticker';
  sticker: InputFile | string;
};

export type MessageUnmodifiedContent = {
  type: 'unmodified';
};

export type MessageContent =
  | string
  | Markdown
  | ReadStream
  | MessageTextContent
  | MessagePhotoContent
  | MessageAudioContent
  | MessageDocumentContent
  | MessageVideoContent
  | MessageAnimationContent
  | MessageVoiceContent
  | MessageVideoNoteContent
  | MessagePaidMediaContent
  | MessageMediaGroupContent
  | MessageLocationContent
  | MessageVenueContent
  | MessageContactContent
  | MessageDiceContent
  | MessagePollContent
  | MessageStickerContent
  | MessageUnmodifiedContent;

export type PreparedMessageContent = Exclude<MessageContent, string | Markdown | ReadStream>;

export type MessageEffect = '👍' | '👎' | '❤️' | '🔥' | '🎉' | '💩' | { id: string };

export type ReplyMarkup =
  | InlineKeyboard
  | ReplyKeyboard
  | InlineKeyboardMarkup
  | ReplyKeyboardMarkup
  | ReplyKeyboardRemove
  | ForceReply;
