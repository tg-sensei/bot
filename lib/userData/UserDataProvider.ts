import { User } from 'typescript-telegram-bot-api/dist/types';

import { Provider } from '../Provider';
import { AnyUpdateContext, getUpdateContextUser } from '../context';
import { MaybePromise } from '../types';

export type UserWithData<UserData> = User & {
  data: UserData;
  setData: (data: UserData) => Promise<void>;
  updateData: <UpdateKeys extends keyof UserData>(update: Pick<UserData, UpdateKeys>) => Promise<UserData>;
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

    if (!user) {
      return null;
    }

    const userWithData: UserWithData<UserData> = {
      ...user,
      data: await this.getOrCreateUserData(user.id),
      setData: async (data) => {
        await this.setUserData(user.id, data);

        userWithData.data = data;
      },
      updateData: async (update) => {
        await userWithData.setData({
          ...userWithData.data,
          ...update,
        });

        return userWithData.data;
      },
    };

    return {
      user: userWithData,
    };
  }
}
