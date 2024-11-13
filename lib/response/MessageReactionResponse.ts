import { ReactionType } from 'typescript-telegram-bot-api';

import { AnyUpdateContext, getUpdateContextMessage } from '../context';
import { isArray } from '../utils';
import { Response } from './Response';

export type MessageReactionResponseOptions = {
  reaction?: ReactionType | ReactionType[];
  isBig?: boolean;
};

export class MessageReactionResponse implements Response {
  readonly reaction?: ReactionType[];
  readonly isBig?: boolean;

  constructor(options?: MessageReactionResponseOptions) {
    this.reaction = options?.reaction ? (isArray(options.reaction) ? options.reaction : [options.reaction]) : undefined;
    this.isBig = options?.isBig;
  }

  async respond(ctx: AnyUpdateContext): Promise<void> {
    const message = getUpdateContextMessage(ctx);

    if (!message) {
      return;
    }

    await ctx.bot.api.setMessageReaction({
      chat_id: message.chat.id,
      message_id: message.message_id,
      reaction: this.reaction,
      is_big: this.isBig,
    });

    ctx.responseSent = true;
  }
}
