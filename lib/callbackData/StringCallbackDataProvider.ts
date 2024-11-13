import { AnyUpdateContext } from '../context';
import { Handler, getHandlerMiddleware } from '../middleware';
import { CallbackDataContextExtension, CallbackDataProvider } from './CallbackDataProvider';

export class StringCallbackDataProvider<
  CallbackData extends string,
  InputContext extends AnyUpdateContext,
> extends CallbackDataProvider<CallbackData, InputContext> {
  // TODO: add support for regex
  handle<Data extends CallbackData>(
    data: Data | Data[],
    handler: Handler<InputContext & CallbackDataContextExtension<Data>>,
  ): this {
    const middleware = getHandlerMiddleware(handler);
    const dataTypes: (CallbackData | null)[] = typeof data === 'string' ? [data] : data;

    return this.use(async (ctx, next) => {
      if (dataTypes.includes(ctx.callbackData)) {
        await middleware(ctx as InputContext & CallbackDataContextExtension<Data>, next);
      } else {
        await next();
      }
    });
  }

  parseCallbackData(dataString: string): CallbackData | null {
    return dataString as CallbackData;
  }

  stringifyData(data: CallbackData): string {
    return data;
  }
}
