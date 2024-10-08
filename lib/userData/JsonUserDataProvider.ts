import { BaseCommand, MessageHandler } from '../TelegramBot';
import { Filter, MaybePromise } from '../types';
import { UserDataProvider } from './UserDataProvider';

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

/* eslint-disable brace-style */
export class JsonUserDataProvider<
  CommandType extends BaseCommand = never,
  CallbackData = never,
  UserData extends BaseJsonUserData<BaseJsonUserDataState> = never,
> implements UserDataProvider<CommandType, CallbackData, UserData>
{
  /* eslint-enable brace-style */
  private readonly _handlers: {
    [State in UserData['state']]?: MessageHandler<
      CommandType,
      CallbackData,
      UserData,
      JsonUserDataByState<UserData, State>,
      true
    >;
  } = {};

  getOrCreateUserData: (userId: number) => MaybePromise<UserData>;
  setUserData: (userId: number, data: UserData) => MaybePromise<void>;

  constructor(options: JsonUserDataProviderOptions<UserData>) {
    this.getOrCreateUserData = options.getOrCreateUserData;
    this.setUserData = options.setUserData;
  }

  getUserDataHandler<Data extends UserData>(
    userData: Data,
  ): MessageHandler<CommandType, CallbackData, UserData, Data, true> | null {
    return (
      (this._handlers[userData.state as Data['state']] as
        | MessageHandler<CommandType, CallbackData, UserData, Data, true>
        | undefined) ?? null
    );
  }

  handle<State extends UserData['state']>(
    state: State | State[],
    handler: MessageHandler<CommandType, CallbackData, UserData, JsonUserDataByState<UserData, State>, true>,
  ): this {
    for (const dataType of typeof state === 'string' ? [state] : state) {
      this._handlers[dataType] = handler;
    }

    return this;
  }
}
