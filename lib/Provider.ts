import { createExtendedContext } from './context';
import { Handler, Middleware } from './middleware';
import { MaybePromise } from './types';
import { runHandlers } from './utils';

export type ProviderContext<P> =
  P extends Provider<infer InputContext, infer ContextExtension> ? InputContext & ContextExtension : never;

export type ProviderContextExtension<P> = P extends Provider<any, infer ContextExtension> ? ContextExtension : never;

export abstract class Provider<InputContext extends object, ContextExtension extends object = {}> {
  private readonly _handlers: Handler<InputContext & ContextExtension>[];

  abstract getContextExtension(ctx: InputContext): MaybePromise<ContextExtension | null>;

  constructor(handlers: Handler<InputContext & ContextExtension>[] = []) {
    this._handlers = handlers;
  }

  middleware(): Middleware<InputContext> {
    return async (ctx, next) => {
      const contextExtension = await this.getContextExtension(ctx);

      if (contextExtension) {
        await runHandlers(this._handlers, createExtendedContext(ctx, contextExtension), next);
      } else {
        await next();
      }
    };
  }

  use(handler: Handler<InputContext & ContextExtension>): this {
    this._handlers.push(handler);

    return this;
  }
}
