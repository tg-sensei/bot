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
import { Message } from 'typescript-telegram-bot-api/dist/types/Message';

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
  point: GeoPoint;
  horizontalAccuracy?: number;
  livePeriod?: number;
  heading?: number;
  proximityAlertRadius?: number;
};

export type MessageStoppedLocationContent = {
  type: 'location';
  point: null;
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

// TODO: add game content
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
  | MessageStoppedLocationContent
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

export type MessageType = keyof typeof MessageTypeContentMap;

export const MessageTypeContentMap = {
  text: 'text',
  animation: 'animation',
  audio: 'audio',
  document: 'document',
  photo: 'photo',
  sticker: 'sticker',
  story: 'story',
  video: 'video',
  video_note: 'videoNote',
  voice: 'voice',
  contact: 'contact',
  dice: 'dice',
  game: 'game',
  poll: 'poll',
  venue: 'venue',
  location: 'location',
  new_chat_members: 'newChatMembers',
  left_chat_member: 'leftChatMember',
  new_chat_title: 'newChatTitle',
  new_chat_photo: 'newChatPhoto',
  delete_chat_photo: 'deleteChatPhoto',
  group_chat_created: 'groupChatCreated',
  supergroup_chat_created: 'supergroupChatCreated',
  channel_chat_created: 'channelChatCreated',
  message_auto_delete_timer_changed: 'messageAutoDeleteTimerChanged',
  migrate_to_chat_id: 'migrateToChatId',
  migrate_from_chat_id: 'migrateFromChatId',
  pinned_message: 'pinnedMessage',
  invoice: 'invoice',
  successful_payment: 'successfulPayment',
  refunded_payment: 'refundedPayment',
  users_shared: 'usersShared',
  chat_shared: 'chatShared',
  write_access_allowed: 'writeAccessAllowed',
  passport_data: 'passportData',
  proximity_alert_triggered: 'proximityAlertTriggered',
  boost_added: 'boostAdded',
  chat_background_set: 'chatBackgroundSet',
  forum_topic_created: 'forumTopicCreated',
  forum_topic_edited: 'forumTopicEdited',
  forum_topic_closed: 'forumTopicClosed',
  forum_topic_reopened: 'forumTopicReopened',
  general_forum_topic_hidden: 'generalForumTopicHidden',
  general_forum_topic_unhidden: 'generalForumTopicUnhidden',
  giveaway_created: 'giveawayCreated',
  giveaway: 'giveaway',
  giveaway_winners: 'giveawayWinners',
  giveaway_completed: 'giveawayCompleted',
  video_chat_scheduled: 'videoChatScheduled',
  video_chat_started: 'videoChatStarted',
  video_chat_ended: 'videoChatEnded',
  video_chat_participants_invited: 'videoChatParticipantsInvited',
  web_app_data: 'webAppData',
} as const;

export type MessageProperties<Type extends MessageType> = {
  [Key in (typeof MessageTypeContentMap)[Type]]: Required<Pick<Message, Type>>[Type];
};

export type AnyMessageProperties = {
  [Type in MessageType]: MessageProperties<Type>;
}[MessageType];
