import { BaseCommand, CallbackQueryHandler } from '../TelegramBot';
import { CallbackDataProvider } from './CallbackDataProvider';

export class StringCallbackDataProvider<
  in out CommandType extends BaseCommand = never,
  in out CallbackData extends string = never,
  in out UserData = never,
> extends CallbackDataProvider<CommandType, CallbackData, UserData> {
  private readonly _handlers: {
    [Data in CallbackData]?: CallbackQueryHandler<CommandType, CallbackData, UserData, Data>;
  } = {};

  getCallbackQueryHandler<Data extends CallbackData>(
    data: Data,
  ): CallbackQueryHandler<CommandType, CallbackData, UserData, Data> | null {
    return this._handlers[data] ?? null;
  }

  // TODO: add support for regex
  handle<Data extends CallbackData>(
    data: Data | Data[],
    handler: CallbackQueryHandler<CommandType, CallbackData, UserData, Data>,
  ): this {
    for (const dataString of typeof data === 'string' ? [data] : data) {
      this._handlers[dataString] = handler;
    }

    return this;
  }

  parseCallbackData(dataString: string): CallbackData | null {
    return dataString as CallbackData;
  }

  stringifyData(data: CallbackData): string {
    return data;
  }
}
