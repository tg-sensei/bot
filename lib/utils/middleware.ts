import { Handler, NextFunction, getHandlerMiddleware } from '../middleware';

export async function runHandlers<Context extends object>(
  handlers: Handler<Context>[],
  ctx: Context,
  next: NextFunction,
): Promise<void> {
  let currentMiddlewareIndex = 0;

  const runMiddleware = async (): Promise<void> => {
    const handler = handlers.at(currentMiddlewareIndex++);

    if (handler) {
      await getHandlerMiddleware(handler)(ctx, runMiddleware);
    } else {
      await next();
    }
  };

  await runMiddleware();
}
