import { InlineKeyboardMarkup, LoginUrl, WebAppInfo } from 'typescript-telegram-bot-api/dist/types';

import { TelegramBotError, TelegramBotErrorCode } from './TelegramBotError';
import { isTruthy } from './utils';

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

export type InlineKeyboardButtons<CallbackData> = (
  | (InlineKeyboardButton<CallbackData> | null | undefined | false | '')[]
  | null
  | undefined
  | false
  | ''
)[];

const BUTTON_TEXT_LIMIT = 120;

export class InlineKeyboard {
  readonly buttons: InlineKeyboardButtons<string>;

  constructor(buttons: InlineKeyboardButtons<string>) {
    this.buttons = buttons;
  }

  getMarkup(): InlineKeyboardMarkup {
    return {
      inline_keyboard: this.buttons
        .filter(isTruthy)
        .map((row, rowIndex) =>
          row.filter(isTruthy).map((button, buttonIndex) => {
            if (!button.text) {
              throw new TelegramBotError(TelegramBotErrorCode.EmptyButtonText);
            }

            const buttonText =
              button.text.length > BUTTON_TEXT_LIMIT ? `${button.text.slice(0, BUTTON_TEXT_LIMIT - 1)}…` : button.text;

            if (button.type === 'url') {
              return {
                text: buttonText,
                url: button.url,
              };
            }

            if (button.type === 'webApp') {
              return {
                text: buttonText,
                web_app: button.appInfo,
              };
            }

            if (button.type === 'login') {
              return {
                text: buttonText,
                login_url: button.login,
              };
            }

            if (button.type === 'switchInlineQuery') {
              return {
                text: buttonText,
                ...(button.target === 'currentChat'
                  ? { switch_inline_query_current_chat: button.query }
                  : {
                      switch_inline_query_chosen_chat: {
                        query: button.query,
                        allow_user_chats: typeof button.target === 'object' ? button.target.allowUsers : undefined,
                        allow_bot_chats: typeof button.target === 'object' ? button.target.allowBots : undefined,
                        allow_group_chats: typeof button.target === 'object' ? button.target.allowGroups : undefined,
                        allow_channel_chats:
                          typeof button.target === 'object' ? button.target.allowChannels : undefined,
                      },
                    }),
              };
            }

            if (button.type === 'callbackGame') {
              return {
                text: buttonText,
                callback_game: {},
              };
            }

            if (button.type === 'pay') {
              return {
                text: buttonText,
                pay: true,
              };
            }

            return {
              text: buttonText,
              callback_data: button.callbackData,
            };
          }),
        )
        .filter((row) => row.length > 0),
    };
  }
}
