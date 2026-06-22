import { InlineKeyboardMarkup } from 'typescript-telegram-bot-api';

import { BaseCommand } from '../TelegramBot';
import { TelegramBotError, TelegramBotErrorCode } from '../TelegramBotError';
import { CallbackDataProvider } from '../callbackData';
import { InlineKeyboard } from '../inlineKeyboard';
import { isTruthy } from './is';

const BUTTON_TEXT_LIMIT = 120;

export async function prepareInlineKeyboard<CommandType extends BaseCommand, CallbackData, UserData>(
  callbackDataProvider: CallbackDataProvider<CommandType, CallbackData, UserData> | undefined,
  keyboard: InlineKeyboard<CallbackData>,
): Promise<InlineKeyboardMarkup> {
  const callbackDataPromises: Promise<{
    rowIndex: number;
    buttonIndex: number;
    callbackData?: string;
  }>[] = [];
  const buttons = keyboard.filter(isTruthy).map((row) => row.filter(isTruthy));

  buttons.forEach((row, rowIndex) => {
    row.forEach((button, buttonIndex) => {
      if (button.type === 'callbackData') {
        callbackDataPromises.push(
          (async () => ({
            rowIndex,
            buttonIndex,
            callbackData: await callbackDataProvider?.stringifyData(button.callbackData),
          }))(),
        );
      }
    });
  });

  const callbackDataValues = await Promise.all(callbackDataPromises);

  return {
    inline_keyboard: buttons
      .map((row, rowIndex) =>
        row.map((button, buttonIndex) => {
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
                      allow_channel_chats: typeof button.target === 'object' ? button.target.allowChannels : undefined,
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

          const callbackDataString = callbackDataValues.find(
            (value) => value.rowIndex === rowIndex && value.buttonIndex === buttonIndex,
          )?.callbackData;

          if (callbackDataString && callbackDataString.length > 64) {
            throw new TelegramBotError(TelegramBotErrorCode.LongCallbackData, {
              message: `Callback data is too long: ${JSON.stringify(callbackDataString)}`,
            });
          }

          return {
            text: buttonText,
            callback_data: callbackDataString,
          };
        }),
      )
      .filter((row) => row.length > 0),
  };
}
