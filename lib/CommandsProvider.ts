import { BotCommand } from 'typescript-telegram-bot-api/dist/types';

import { Provider } from './Provider';
import { AnyUpdateContext, getUpdateContextMessage } from './context';
import { Handler, getHandlerMiddleware } from './middleware';
import { isTruthy } from './utils';

export type BaseCommand = `/${string}`;

export type CommandsContextExtension = {
  commands: string[];
};

export type BotCommands<Command extends BaseCommand> = Partial<Record<Command, string>>;

export class CommandsProvider<Command extends BaseCommand, InputContext extends AnyUpdateContext> extends Provider<
  InputContext,
  CommandsContextExtension
> {
  getContextExtension(ctx: InputContext): CommandsContextExtension {
    // @ts-ignore
    const meInfo = ctx.bot._meInfo;
    const message = getUpdateContextMessage(ctx);
    const textWithEntities = message?.text
      ? { text: message.text, entities: message.entities }
      : { text: message?.caption, entities: message?.caption_entities };

    return {
      commands:
        textWithEntities.entities
          ?.filter(({ type }) => type === 'bot_command')
          .map(({ offset, length }) => {
            const fullCommand = textWithEntities.text?.slice(offset, offset + length);

            if (!fullCommand) {
              return;
            }

            const split = fullCommand.split('@');
            const botUsername = split.at(1);

            if (botUsername && botUsername !== meInfo?.username) {
              return;
            }

            return split[0];
          })
          .filter(isTruthy) ?? [],
    };
  }

  handle(command: Command | Command[], handler: Handler<InputContext & CommandsContextExtension>): this {
    const middleware = getHandlerMiddleware(handler);
    const commands = typeof command === 'string' ? [command] : command;

    return this.use(async (ctx, next) => {
      if (commands.some((command) => ctx.commands.includes(command))) {
        await middleware(ctx, next);
      } else {
        await next();
      }
    });
  }

  prepareCommands(commands: BotCommands<Command>): BotCommand[] {
    const commandsArray: BotCommand[] = [];

    for (const command in commands) {
      const description = commands[command];

      if (description) {
        commandsArray.push({
          command,
          description,
        });
      }
    }

    return commandsArray;
  }
}
