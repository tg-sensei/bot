import { InlineKeyboard, InlineKeyboardButtons } from '../InlineKeyboard';
import { BaseCommand, CallbackQueryHandler } from '../TelegramBot';
import { TelegramBotError, TelegramBotErrorCode } from '../TelegramBotError';
import { MaybePromise } from '../types';

export abstract class CallbackDataProvider<
  in out CommandType extends BaseCommand,
  in out CallbackData,
  in out UserData,
> {
  abstract getCallbackQueryHandler<Data extends CallbackData>(
    data: Data,
  ): CallbackQueryHandler<NoInfer<CommandType>, CallbackData, NoInfer<UserData>, Data> | null;

  abstract parseCallbackData(dataString: string): MaybePromise<CallbackData | null>;

  abstract stringifyData(data: CallbackData): MaybePromise<string>;

  async buildInlineKeyboard(buttons: InlineKeyboardButtons<CallbackData>): Promise<InlineKeyboard> {
    const callbackDataPromises: Promise<{
      rowIndex: number;
      buttonIndex: number;
      callbackData?: string;
    }>[] = [];

    buttons.forEach((row, rowIndex) => {
      if (!row) {
        return;
      }

      row.forEach((button, buttonIndex) => {
        if (button && button.type === 'callbackData') {
          callbackDataPromises.push(
            (async () => ({
              rowIndex,
              buttonIndex,
              callbackData: await this.stringifyData(button.callbackData),
            }))(),
          );
        }
      });
    });

    const callbackDataValues = await Promise.all(callbackDataPromises);

    return new InlineKeyboard(
      buttons.map(
        (row, rowIndex) =>
          row &&
          row.map((button, buttonIndex) => {
            if (!button || button.type !== 'callbackData') {
              return button;
            }

            const callbackDataString = callbackDataValues.find(
              (value) => value.rowIndex === rowIndex && value.buttonIndex === buttonIndex,
            )?.callbackData;

            if (!callbackDataString) {
              throw new TelegramBotError(TelegramBotErrorCode.MissingCallbackData, {
                message: `Callback data is missing (rowIndex: ${rowIndex}, buttonIndex: ${buttonIndex})`,
              });
            }

            if (callbackDataString.length > 64) {
              throw new TelegramBotError(TelegramBotErrorCode.LongCallbackData, {
                message: `Callback data is too long: ${JSON.stringify(callbackDataString)}`,
              });
            }

            return {
              type: 'callbackData',
              text: button.text,
              callbackData: callbackDataString,
            };
          }),
      ),
    );
  }
}
