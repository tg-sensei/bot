import { AnyUpdateContext } from '../context';
import { MaybePromise } from '../types';
import { upsertInMap } from '../utils';
import { StringUserDataProvider } from './StringUserDataProvider';

export type MemoryStringUserDataProviderOptions<UserData extends string> = {
  defaultValue: UserData | ((userId: number) => UserData);
};

export class MemoryStringUserDataProvider<
  UserData extends string,
  InputContext extends AnyUpdateContext,
> extends StringUserDataProvider<UserData, InputContext> {
  private readonly _userDataMap = new Map<number, UserData>();
  private readonly _getDefaultValue: (userId: number) => MaybePromise<UserData>;

  constructor(options: MemoryStringUserDataProviderOptions<UserData>) {
    super({
      getOrCreateUserData: (userId) => upsertInMap(this._userDataMap, userId, () => this._getDefaultValue(userId)),
      setUserData: (userId, data) => {
        this._userDataMap.set(userId, data);
      },
    });

    const { defaultValue } = options;

    this._getDefaultValue = typeof defaultValue === 'function' ? defaultValue : () => defaultValue;
  }

  clear(): void {
    this._userDataMap.clear();
  }
}
