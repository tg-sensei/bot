import { UpdateType } from 'typescript-telegram-bot-api/dist/types';

import { Provider } from './Provider';
import { AnyUpdate, AnyUpdateContext, BaseContext, UpdateByType } from './context';
import { Handler, getHandlerMiddleware } from './middleware';

export type UpdatesContextExtension<Type extends UpdateType> = Omit<
  UpdateType extends Type ? AnyUpdate : UpdateByType<Type>,
  'type'
>;

export type UpdatesContextByType<Type extends UpdateType> = BaseContext & {
  update: UpdateByType<Type>;
} & UpdatesContextExtension<Type>;

export class UpdatesProvider<InputContext extends AnyUpdateContext> extends Provider<
  InputContext,
  UpdatesContextExtension<UpdateType>
> {
  getContextExtension(ctx: InputContext): UpdatesContextExtension<UpdateType> {
    const { type, ...rest } = ctx.update;

    return rest;
  }

  handle<Type extends UpdateType>(updateType: Type | Type[], handler: Handler<UpdatesContextByType<Type>>): this {
    const middleware = getHandlerMiddleware(handler);
    const updateTypes: UpdateType[] = typeof updateType === 'string' ? [updateType] : updateType;

    return this.use(async (ctx, next) => {
      if (updateTypes.includes(ctx.update.type)) {
        await middleware(ctx as any, next);
      } else {
        await next();
      }
    });
  }
}
