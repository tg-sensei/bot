import { AnyUpdateContext } from '../context';
import { Handler, getHandlerMiddleware } from '../middleware';
import { MaybePromise } from '../types';
import { UserDataContextExtension, UserDataProvider } from './UserDataProvider';

export type StringUserDataProviderOptions<UserData extends string> = {
  getOrCreateUserData: (userId: number) => MaybePromise<UserData>;
  setUserData: (userId: number, data: UserData) => MaybePromise<void>;
};

export class StringUserDataProvider<
  UserData extends string,
  InputContext extends AnyUpdateContext,
> extends UserDataProvider<UserData, InputContext> {
  getOrCreateUserData: (userId: number) => MaybePromise<UserData>;
  setUserData: (userId: number, data: UserData) => MaybePromise<void>;

  constructor(options: StringUserDataProviderOptions<UserData>) {
    super();

    this.getOrCreateUserData = options.getOrCreateUserData;
    this.setUserData = options.setUserData;
  }

  handle<Data extends UserData>(
    data: Data | Data[],
    handler: Handler<InputContext & UserDataContextExtension<Data>>,
  ): this {
    const middleware = getHandlerMiddleware(handler);
    const dataTypes: (UserData | null | undefined)[] = typeof data === 'string' ? [data] : data;

    return this.use(async (ctx, next) => {
      if (dataTypes.includes(ctx.user?.data)) {
        await middleware(ctx as InputContext & UserDataContextExtension<Data>, next);
      } else {
        await next();
      }
    });
  }
}
