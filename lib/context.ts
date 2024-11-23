import { Message, UpdateType, User } from 'typescript-telegram-bot-api/dist/types';
import { EventTypes } from 'typescript-telegram-bot-api/dist/types/Update';

import { TelegramBot } from './TelegramBot';
import { Response } from './response';
import { createInheritedObject } from './utils/object';

export type BaseContext = {
  bot: TelegramBot;
  get responseSent(): boolean;
  set responseSent(value: true);
  respondWith(response: Response): Promise<void>;
};

export const UpdateTypePropertyMap = {
  message: 'message',
  edited_message: 'editedMessage',
  channel_post: 'channelPost',
  edited_channel_post: 'editedChannelPost',
  business_connection: 'businessConnection',
  business_message: 'businessMessage',
  edited_business_message: 'editedBusinessMessage',
  deleted_business_messages: 'deletedBusinessMessages',
  message_reaction: 'messageReaction',
  message_reaction_count: 'messageReactionCount',
  inline_query: 'inlineQuery',
  chosen_inline_result: 'chosenInlineResult',
  callback_query: 'callbackQuery',
  shipping_query: 'shippingQuery',
  pre_checkout_query: 'preCheckoutQuery',
  purchased_paid_media: 'purchasedPaidMedia',
  poll: 'poll',
  poll_answer: 'pollAnswer',
  my_chat_member: 'myChatMember',
  chat_member: 'chatMember',
  chat_join_request: 'chatJoinRequest',
  chat_boost: 'chatBoost',
  removed_chat_boost: 'removedChatBoost',
} as const;

export type AnyUpdate = {
  [Type in UpdateType]: UpdateByType<Type>;
}[UpdateType];

export type UpdateByType<Type extends UpdateType> = {
  type: Type;
} & {
  [Key in (typeof UpdateTypePropertyMap)[Type]]: EventTypes[Type];
};

export type AnyUpdateContext = BaseContext & {
  update: AnyUpdate;
};

export function createExtendedContext<InputContext extends object, ContextExtension extends object>(
  ctx: InputContext,
  extension: ContextExtension,
): InputContext & ContextExtension {
  return createInheritedObject(ctx, extension);
}

export function getUpdateContextMessage(ctx: AnyUpdateContext): Message | null {
  return ctx.update.type === 'message'
    ? ctx.update.message
    : ctx.update.type === 'edited_message'
      ? ctx.update.editedMessage
      : ctx.update.type === 'channel_post'
        ? ctx.update.channelPost
        : ctx.update.type === 'edited_channel_post'
          ? ctx.update.editedChannelPost
          : ctx.update.type === 'business_message'
            ? ctx.update.businessMessage
            : ctx.update.type === 'edited_business_message'
              ? ctx.update.editedBusinessMessage
              : ctx.update.type === 'callback_query' && ctx.update.callbackQuery.message?.date
                ? ctx.update.callbackQuery.message
                : null;
}

export function getUpdateContextUser(ctx: AnyUpdateContext): User | null {
  if (ctx.update.type === 'callback_query') {
    return ctx.update.callbackQuery.from;
  }

  const message = getUpdateContextMessage(ctx);

  if (message) {
    return message.from ?? null;
  }

  return null;
}
