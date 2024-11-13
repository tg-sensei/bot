import { User } from 'typescript-telegram-bot-api/dist/types';

import { Provider } from './Provider';
import { AnyUpdateContext, getUpdateContextUser } from './context';

export type UserContextExtension = {
  user: User;
};

export class UserProvider<InputContext extends AnyUpdateContext> extends Provider<InputContext, UserContextExtension> {
  async getContextExtension(ctx: InputContext): Promise<UserContextExtension | null> {
    const user = getUpdateContextUser(ctx);

    return (
      user && {
        user,
      }
    );
  }
}
