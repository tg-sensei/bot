import { Provider } from './Provider';

export type NextFunction = () => Promise<void>;

export type Middleware<Context> = (ctx: Context, next: NextFunction) => unknown;

export type Handler<Context extends object> = Provider<Context, any> | Middleware<Context>;

export function getHandlerMiddleware<Context extends object>(handler: Handler<Context>): Middleware<Context> {
  return typeof handler === 'function' ? handler : handler.middleware();
}
