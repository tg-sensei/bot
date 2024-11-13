import { AnyUpdateContext } from '../context';
import { Handler, getHandlerMiddleware } from '../middleware';
import { Filter, MaybePromise } from '../types';
import { UserDataContextExtension, UserDataProvider } from './UserDataProvider';

export type BaseJsonUserDataState = string;

export type BaseJsonUserData<State extends BaseJsonUserDataState> = {
  state: State;
};

export type JsonUserDataByState<
  UserData extends BaseJsonUserData<BaseJsonUserDataState>,
  T extends UserData['state'],
> = Filter<UserData, { state: T }>;

export type JsonUserDataProviderOptions<UserData extends BaseJsonUserData<BaseJsonUserDataState>> = {
  getOrCreateUserData: (userId: number) => MaybePromise<UserData>;
  setUserData: (userId: number, data: UserData) => MaybePromise<void>;
};

export class JsonUserDataProvider<
  UserData extends BaseJsonUserData<BaseJsonUserDataState>,
  InputContext extends AnyUpdateContext,
> extends UserDataProvider<UserData, InputContext> {
  getOrCreateUserData: (userId: number) => MaybePromise<UserData>;
  setUserData: (userId: number, data: UserData) => MaybePromise<void>;

  constructor(options: JsonUserDataProviderOptions<UserData>) {
    super();

    this.getOrCreateUserData = options.getOrCreateUserData;
    this.setUserData = options.setUserData;
  }

  handle<State extends UserData['state']>(
    state: State | State[],
    handler: Handler<InputContext & UserDataContextExtension<JsonUserDataByState<UserData, State>>>,
  ): this {
    const middleware = getHandlerMiddleware(handler);
    const states: (UserData['state'] | null | undefined)[] = typeof state === 'string' ? [state] : state;

    return this.use(async (ctx, next) => {
      if (states.includes(ctx.user?.data?.state)) {
        await middleware(ctx as InputContext & UserDataContextExtension<JsonUserDataByState<UserData, State>>, next);
      } else {
        await next();
      }
    });
  }
}
