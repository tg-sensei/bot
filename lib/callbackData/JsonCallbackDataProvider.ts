import { BaseCommand, CallbackQueryHandler } from '../TelegramBot';
import { Filter, MaybePromise } from '../types';
import { CallbackDataProvider } from './CallbackDataProvider';

export type BaseJsonCallbackDataType = string;

export type BaseJsonCallbackData<Type extends BaseJsonCallbackDataType> = {
  type: Type;
};

export type JsonCallbackDataByType<
  CallbackData extends BaseJsonCallbackData<BaseJsonCallbackDataType>,
  T extends CallbackData['type'],
> = Filter<CallbackData, { type: T }>;

export type JsonCallbackDataProviderOptions<
  Type extends BaseJsonCallbackDataType,
  CallbackData extends BaseJsonCallbackData<Type>,
> = {
  parseJson?: (json: string) => CallbackData;
};

export class JsonCallbackDataProvider<
  in out CommandType extends BaseCommand = never,
  in out CallbackData extends BaseJsonCallbackData<BaseJsonCallbackDataType> = never,
  in out UserData = never,
> extends CallbackDataProvider<CommandType, CallbackData, UserData> {
  private readonly _handlers: {
    [Type in CallbackData['type']]?: CallbackQueryHandler<
      CommandType,
      CallbackData,
      UserData,
      JsonCallbackDataByType<CallbackData, Type>
    >;
  } = {};
  private readonly _parseJson: (json: string) => CallbackData;

  constructor(options: JsonCallbackDataProviderOptions<CallbackData['type'], CallbackData> = {}) {
    super();

    this._parseJson = options.parseJson ?? JSON.parse;
  }

  getCallbackQueryHandler<Data extends CallbackData>(
    data: Data,
  ): CallbackQueryHandler<CommandType, CallbackData, UserData, Data> | null {
    return (
      (this._handlers[data.type as Data['type']] as
        | CallbackQueryHandler<CommandType, CallbackData, UserData, Data>
        | undefined) ?? null
    );
  }

  handle<Type extends CallbackData['type']>(
    type: Type | Type[],
    handler: CallbackQueryHandler<CommandType, CallbackData, UserData, JsonCallbackDataByType<CallbackData, Type>>,
  ): this {
    for (const dataType of typeof type === 'string' ? [type] : type) {
      this._handlers[dataType] = handler;
    }

    return this;
  }

  parseCallbackData(dataString: string): MaybePromise<CallbackData | null> {
    let data: CallbackData;

    try {
      data = this._parseJson(dataString);
    } catch {
      return null;
    }

    return data;
  }

  stringifyData(data: CallbackData): MaybePromise<string> {
    return JSON.stringify(data);
  }
}
