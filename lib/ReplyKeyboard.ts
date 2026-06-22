import { ChatAdministratorRights, ReplyKeyboardMarkup } from 'typescript-telegram-bot-api';

import { isTruthy } from './utils';

export type BaseReplyKeyboardButton = {
  text: string;
};

export type TextReplyKeyboardButton = BaseReplyKeyboardButton & {
  type: 'text';
};

export type RequestUsersReplyKeyboardButton = BaseReplyKeyboardButton & {
  type: 'requestUsers';
  requestId: number;
  isBot?: boolean;
  isPremium?: boolean;
  maxQuantity?: number;
  requestName?: boolean;
  requestUsername?: boolean;
  requestPhoto?: boolean;
};

export type RequestChatReplyKeyboardButton = BaseReplyKeyboardButton & {
  type: 'requestChat';
  requestId: number;
  isChannel: boolean;
  isForum?: boolean;
  hasUsername?: boolean;
  isCreated?: boolean;
  userAdministratorRights?: ChatAdministratorRights;
  botAdministratorRights?: ChatAdministratorRights;
  botIsMember?: boolean;
  requestTitle?: boolean;
  requestUsername?: boolean;
  requestPhoto?: boolean;
};

export type RequestContactReplyKeyboardButton = BaseReplyKeyboardButton & {
  type: 'requestContact';
};

export type RequestLocationReplyKeyboardButton = BaseReplyKeyboardButton & {
  type: 'requestLocation';
};

export type RequestPollReplyKeyboardButton = BaseReplyKeyboardButton & {
  type: 'requestPoll';
  pollType?: 'quiz' | 'regular';
};

export type WebAppReplyKeyboardButton = BaseReplyKeyboardButton & {
  type: 'webApp';
  url: string;
};

export type ReplyKeyboardButton =
  | TextReplyKeyboardButton
  | RequestUsersReplyKeyboardButton
  | RequestChatReplyKeyboardButton
  | RequestContactReplyKeyboardButton
  | RequestLocationReplyKeyboardButton
  | RequestPollReplyKeyboardButton
  | WebAppReplyKeyboardButton;

export type ReplyKeyboardOptions = {
  buttons: ((ReplyKeyboardButton | null | undefined | false | string)[] | null | undefined | false | '')[];
  isPersistent?: boolean;
  resize?: boolean;
  oneTime?: boolean;
  inputFieldPlaceholder?: string;
  selective?: boolean;
};

export class ReplyKeyboard {
  readonly buttons: ReplyKeyboardButton[][];
  readonly isPersistent?: boolean;
  readonly resize?: boolean;
  readonly oneTime?: boolean;
  readonly inputFieldPlaceholder?: string;
  readonly selective?: boolean;

  constructor(options: ReplyKeyboardOptions) {
    this.buttons = options.buttons
      .filter(isTruthy)
      .map((row) =>
        row
          .filter(isTruthy)
          .map((button) => (typeof button === 'string' ? ({ type: 'text', text: button } as const) : button)),
      )
      .filter((row) => row.length > 0);
    this.isPersistent = options.isPersistent;
    this.resize = options.resize;
    this.oneTime = options.oneTime;
    this.inputFieldPlaceholder = options.inputFieldPlaceholder;
    this.selective = options.selective;
  }

  getMarkup(): ReplyKeyboardMarkup {
    return {
      keyboard: this.buttons.map((row) =>
        row.map((button) => {
          if (button.type === 'requestUsers') {
            return {
              text: button.text,
              request_users: {
                request_id: button.requestId,
                user_is_bot: button.isBot,
                user_is_premium: button.isPremium,
                max_quantity: button.maxQuantity,
                request_name: button.requestName,
                request_username: button.requestUsername,
                request_photo: button.requestPhoto,
              },
            };
          }

          if (button.type === 'requestChat') {
            return {
              text: button.text,
              request_chat: {
                request_id: button.requestId,
                chat_is_channel: button.isChannel,
                chat_is_forum: button.isForum,
                chat_has_username: button.hasUsername,
                chat_is_created: button.isCreated,
                user_administrator_rights: button.userAdministratorRights,
                bot_administrator_rights: button.botAdministratorRights,
                bot_is_member: button.botIsMember,
                request_title: button.requestTitle,
                request_username: button.requestUsername,
                request_photo: button.requestPhoto,
              },
            };
          }

          if (button.type === 'requestContact') {
            return {
              text: button.text,
              request_contact: true,
            };
          }

          if (button.type === 'requestLocation') {
            return {
              text: button.text,
              request_location: true,
            };
          }

          if (button.type === 'requestPoll') {
            return {
              text: button.text,
              request_poll: {
                type: button.pollType,
              },
            };
          }

          if (button.type === 'webApp') {
            return {
              text: button.text,
              web_app: {
                url: button.url,
              },
            };
          }

          return {
            text: button.text,
          };
        }),
      ),
      is_persistent: this.isPersistent,
      resize_keyboard: this.resize,
      one_time_keyboard: this.oneTime,
      input_field_placeholder: this.inputFieldPlaceholder,
      selective: this.selective,
    };
  }
}
