import { LoginUrl, WebAppInfo } from 'typescript-telegram-bot-api';

export type InlineKeyboard<CallbackData> = (
  | (InlineKeyboardButton<CallbackData> | null | undefined | false | '')[]
  | null
  | undefined
  | false
  | ''
)[];

export type BaseInlineKeyboardButton = {
  text: string;
};

export type CallbackInlineKeyboardButton<CallbackData> = BaseInlineKeyboardButton & {
  type: 'callbackData';
  callbackData: CallbackData;
};

export type UrlInlineKeyboardButton = BaseInlineKeyboardButton & {
  type: 'url';
  url: string;
};

export type WebAppInlineKeyboardButton = BaseInlineKeyboardButton & {
  type: 'webApp';
  appInfo: WebAppInfo;
};

export type LoginInlineKeyboardButton = BaseInlineKeyboardButton & {
  type: 'login';
  login: LoginUrl;
};

export type SwitchInlineQueryInlineKeyboardButton = BaseInlineKeyboardButton & {
  type: 'switchInlineQuery';
  query: string;
  target:
    | 'currentChat'
    | 'externalChat'
    | {
        allowUsers?: boolean;
        allowBots?: boolean;
        allowGroups?: boolean;
        allowChannels?: boolean;
      };
};

export type CallbackGameInlineKeyboardButton = BaseInlineKeyboardButton & {
  type: 'callbackGame';
};

export type PayInlineKeyboardButton = BaseInlineKeyboardButton & {
  type: 'pay';
};

export type InlineKeyboardButton<CallbackData> =
  | UrlInlineKeyboardButton
  | CallbackInlineKeyboardButton<CallbackData>
  | WebAppInlineKeyboardButton
  | LoginInlineKeyboardButton
  | SwitchInlineQueryInlineKeyboardButton
  | CallbackGameInlineKeyboardButton
  | PayInlineKeyboardButton;
