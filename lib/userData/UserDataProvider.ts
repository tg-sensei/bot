import { User } from 'typescript-telegram-bot-api/dist/types';

import { Provider } from '../Provider';
import { AnyUpdateContext, getUpdateContextUser } from '../context';
import { MaybePromise } from '../types';

export type UserWithData<UserData> = User & {
  data: UserData;
};

export type UserDataContextExtension<UserData> = {
  user: UserWithData<UserData>;
};

export abstract class UserDataProvider<UserData, InputContext extends AnyUpdateContext> extends Provider<
  InputContext,
  UserDataContextExtension<UserData>
> {
  abstract getOrCreateUserData(userId: number): MaybePromise<UserData>;
  abstract setUserData(userId: number, data: UserData): MaybePromise<void>;

  async getContextExtension(ctx: InputContext): Promise<UserDataContextExtension<UserData> | null> {
    const user = getUpdateContextUser(ctx);

    return (
      user && {
        user: {
          ...user,
          data: await this.getOrCreateUserData(user.id),
        },
      }
    );
  }
}
