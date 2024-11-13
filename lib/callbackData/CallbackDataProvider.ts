import { InlineKeyboard, InlineKeyboardButtons } from '../InlineKeyboard';
import { Provider } from '../Provider';
import { TelegramBotError, TelegramBotErrorCode } from '../TelegramBotError';
import { AnyUpdateContext } from '../context';
import { MaybePromise } from '../types';

export type CallbackDataContextExtension<CallbackData> = {
  callbackData: CallbackData;
};

export abstract class CallbackDataProvider<CallbackData, InputContext extends AnyUpdateContext> extends Provider<
  InputContext,
  CallbackDataContextExtension<CallbackData | null>
> {
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

  async getContextExtension(ctx: InputContext): Promise<CallbackDataContextExtension<CallbackData> | null> {
    const query = ctx.update.type === 'callback_query' ? ctx.update.callbackQuery.data : null;
    const parsedQuery = query == null ? null : await this.parseCallbackData(query);

    return (
      parsedQuery && {
        callbackData: parsedQuery,
      }
    );
  }
}
