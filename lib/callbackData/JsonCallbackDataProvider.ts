import { AnyUpdateContext } from '../context';
import { Handler, getHandlerMiddleware } from '../middleware';
import { Filter, MaybePromise } from '../types';
import { CallbackDataContextExtension, CallbackDataProvider } from './CallbackDataProvider';

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
  CallbackData extends BaseJsonCallbackData<BaseJsonCallbackDataType>,
  InputContext extends AnyUpdateContext,
> extends CallbackDataProvider<CallbackData, InputContext> {
  private readonly _parseJson: (json: string) => CallbackData;

  constructor(options: JsonCallbackDataProviderOptions<CallbackData['type'], CallbackData> = {}) {
    super();

    this._parseJson = options.parseJson ?? JSON.parse;
  }

  handle<Type extends CallbackData['type']>(
    type: Type | Type[],
    handler: Handler<InputContext & CallbackDataContextExtension<JsonCallbackDataByType<CallbackData, Type>>>,
  ): this {
    const middleware = getHandlerMiddleware(handler);
    const dataTypes: (CallbackData['type'] | undefined)[] = typeof type === 'string' ? [type] : type;

    return this.use(async (ctx, next) => {
      if (dataTypes.includes(ctx.callbackData?.type)) {
        await middleware(
          ctx as InputContext & CallbackDataContextExtension<JsonCallbackDataByType<CallbackData, Type>>,
          next,
        );
      } else {
        await next();
      }
    });
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
