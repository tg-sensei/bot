import { ReactionType } from 'typescript-telegram-bot-api';

import { BaseCommand } from '../TelegramBot';
import { isArray } from '../utils';
import { Response, ResponseOnMessageContext } from './Response';

export type MessageReactionResponseOptions = {
  reaction?: ReactionType | ReactionType[];
  isBig?: boolean;
};

/* eslint-disable brace-style */
export class MessageReactionResponse<CommandType extends BaseCommand = never, CallbackData = never, UserData = never>
  implements Response<CommandType, CallbackData, UserData>
{
  /* eslint-enable brace-style */
  readonly reaction?: ReactionType[];
  readonly isBig?: boolean;

  constructor(options?: MessageReactionResponseOptions) {
    this.reaction = options?.reaction ? (isArray(options.reaction) ? options.reaction : [options.reaction]) : undefined;
    this.isBig = options?.isBig;
  }

  async onMessage(ctx: ResponseOnMessageContext<CommandType, CallbackData, UserData>): Promise<void> {
    await ctx.bot.api.setMessageReaction({
      chat_id: ctx.message.chat.id,
      message_id: ctx.message.message_id,
      reaction: this.reaction,
      is_big: this.isBig,
    });
  }
}
