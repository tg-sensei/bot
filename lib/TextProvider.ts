import { Provider } from './Provider';
import { AnyUpdateContext, getUpdateContextMessage } from './context';
import { Handler, getHandlerMiddleware } from './middleware';

export type TextContextExtension = {
  text: string;
};

export class TextProvider<InputContext extends AnyUpdateContext> extends Provider<InputContext, TextContextExtension> {
  getContextExtension(ctx: InputContext): TextContextExtension | null {
    const message = getUpdateContextMessage(ctx);

    return message?.text == null
      ? null
      : {
          text: message.text,
        };
  }

  handle(text: string | string[] | RegExp, handler: Handler<InputContext & TextContextExtension>): this {
    const middleware = getHandlerMiddleware(handler);
    const checkText: (textToCheck: string) => boolean =
      typeof text === 'string'
        ? (textToCheck) => textToCheck === text
        : text instanceof RegExp
          ? (textToCheck) => text.test(textToCheck)
          : (textToCheck) => text.includes(textToCheck);

    return this.use(async (ctx, next) => {
      if (checkText(ctx.text)) {
        await middleware(ctx, next);
      } else {
        await next();
      }
    });
  }
}
