import { ReactionType } from 'typescript-telegram-bot-api';

import { BaseCommand } from '../TelegramBot';
import { isArray } from '../utils';
import { Action, ActionOnMessageContext } from './Action';

export type MessageReactionActionOptions = {
  reaction?: ReactionType | ReactionType[];
  isBig?: boolean;
};

/* eslint-disable brace-style */
export class MessageReactionAction<CommandType extends BaseCommand = never, CallbackData = never, UserData = never>
  implements Action<CommandType, CallbackData, UserData>
{
  /* eslint-enable brace-style */
  readonly reaction?: ReactionType[];
  readonly isBig?: boolean;

  constructor(options?: MessageReactionActionOptions) {
    this.reaction = options?.reaction ? (isArray(options.reaction) ? options.reaction : [options.reaction]) : undefined;
    this.isBig = options?.isBig;
  }

  async onMessage(ctx: ActionOnMessageContext<CommandType, CallbackData, UserData>): Promise<void> {
    await ctx.bot.api.setMessageReaction({
      chat_id: ctx.message.chat.id,
      message_id: ctx.message.message_id,
      reaction: this.reaction,
      is_big: this.isBig,
    });
  }
}
