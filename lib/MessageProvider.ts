import { Message } from 'typescript-telegram-bot-api/dist/types';

import { Provider } from './Provider';
import { AnyUpdateContext, getUpdateContextMessage } from './context';
import { AnyMessageProperties, MessageProperties, MessageType, MessageTypeContentMap } from './message';
import { Handler, getHandlerMiddleware } from './middleware';

export type MessageContextExtension<Type extends MessageType> = {
  message: Message &
    (MessageType extends Type
      ? {
          [Type in MessageType]: Required<Pick<Message, Type>>;
        }[MessageType]
      : Required<Pick<Message, Type>>);
} & (MessageType extends Type ? AnyMessageProperties : MessageProperties<Type>);

export class MessageProvider<InputContext extends AnyUpdateContext> extends Provider<
  InputContext,
  MessageContextExtension<MessageType>
> {
  getContextExtension(ctx: InputContext): MessageContextExtension<MessageType> | null {
    const message = getUpdateContextMessage(ctx);

    if (!message) {
      return null;
    }

    for (const messageType in MessageTypeContentMap) {
      const messageContent = message[messageType as MessageType];

      if (messageContent !== undefined) {
        return {
          message,
          [MessageTypeContentMap[messageType as MessageType]]: messageContent,
        } as MessageContextExtension<MessageType>;
      }
    }

    return null;
  }

  handle<Type extends MessageType>(
    messageType: Type | Type[],
    handler: Handler<InputContext & MessageContextExtension<Type>>,
  ): this {
    const middleware = getHandlerMiddleware(handler);
    const messageTypes: MessageType[] = typeof messageType === 'string' ? [messageType] : messageType;

    return this.use(async (ctx, next) => {
      if (messageTypes.some((messageType) => ctx.message[messageType] !== undefined)) {
        await middleware(ctx as any, next);
      } else {
        await next();
      }
    });
  }
}
