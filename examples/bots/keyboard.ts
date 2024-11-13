import { z } from 'zod';

import {
  CommandsProvider,
  InlineKeyboardButtons,
  JsonCallbackDataProvider,
  Markdown,
  MessageProvider,
  MessageResponse,
  NotificationResponse,
  ProviderContext,
  ReplyKeyboard,
  UpdatesContextByType,
  UpdatesProvider,
} from '../../lib';
import { InitBot } from '../runExample';

const commands = {
  '/example_inline': 'Inline keyboard example',
  '/example_reply': 'Reply keyboard example',
};

type BotCommand = keyof typeof commands;

const callbackData = z.union([
  z.object({
    type: z.literal('notificationResponse'),
  }),
  z.object({
    type: z.literal('alertResponse'),
  }),
  z.object({
    type: z.literal('editTextResponse'),
  }),
]);

type CallbackData = z.TypeOf<typeof callbackData>;

const inlineKeyboard: InlineKeyboardButtons<CallbackData> = [
  [
    {
      type: 'callbackData',
      text: 'Notification response',
      callbackData: {
        type: 'notificationResponse',
      },
    },
  ],
  [
    {
      type: 'callbackData',
      text: 'Alert response',
      callbackData: {
        type: 'alertResponse',
      },
    },
  ],
  [
    {
      type: 'callbackData',
      text: 'Edit text response',
      callbackData: {
        type: 'editTextResponse',
      },
    },
  ],
];

const closeKeyboardText = 'Close keyboard';

const replyKeyboard = new ReplyKeyboard({
  buttons: [
    ['Simple reply button'],
    [
      {
        type: 'requestUsers',
        text: 'Send users',
        requestId: 1,
        maxQuantity: 10,
        requestName: true,
      },
    ],
    [
      {
        type: 'requestChat',
        text: 'Send chat',
        requestId: 2,
        isChannel: false,
        requestTitle: true,
      },
    ],
    [
      {
        type: 'requestContact',
        text: 'Send contact',
      },
    ],
    [
      {
        type: 'requestPoll',
        text: 'Send poll',
      },
    ],
    [
      {
        type: 'requestLocation',
        text: 'Send location',
      },
    ],
    [closeKeyboardText],
  ],
  resize: true,
});

const initBot: InitBot = async (bot) => {
  const updatesProvider = new UpdatesProvider();
  const messageProvider = new MessageProvider();
  const commandsProvider = new CommandsProvider<BotCommand, ProviderContext<typeof messageProvider>>();
  const callbackDataProvider = new JsonCallbackDataProvider<CallbackData, UpdatesContextByType<'callback_query'>>({
    parseJson: (json) => callbackData.parse(JSON.parse(json)),
  });

  commandsProvider.handle('/example_inline', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: 'Inline keyboard example',
        replyMarkup: await callbackDataProvider.buildInlineKeyboard(inlineKeyboard),
      }),
    );
  });

  commandsProvider.handle('/example_reply', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: 'Reply keyboard example',
        replyMarkup: replyKeyboard,
      }),
    );
  });

  messageProvider.handle('users_shared', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: Markdown.create`You've shared: ${Markdown.join(
          ctx.usersShared.users.map(({ user_id, first_name }) =>
            Markdown.telegramUser(user_id, first_name ?? `user${user_id}`),
          ),
          ', ',
        )}`,
      }),
    );
  });

  messageProvider.handle('chat_shared', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: `You've shared chat (#${ctx.chatShared.chat_id}) with title ${JSON.stringify(ctx.chatShared.title)}`,
      }),
    );
  });

  updatesProvider.handle('message', async (ctx, next) => {
    const { contact, location, poll, text } = ctx.message;

    if (contact) {
      return ctx.respondWith(
        new MessageResponse({
          content: `You've shared a contact: ${contact.first_name} (${contact.phone_number})`,
        }),
      );
    }

    if (poll) {
      return ctx.respondWith(
        new MessageResponse({
          content: `You've shared a poll: ${poll.question}`,
        }),
      );
    }

    if (location) {
      return ctx.respondWith(
        new MessageResponse({
          content: `You've shared a location: ${location.latitude}, ${location.longitude}`,
        }),
      );
    }

    if (text === closeKeyboardText) {
      return ctx.respondWith(
        new MessageResponse({
          content: 'Keyboard closed',
          replyMarkup: {
            remove_keyboard: true,
          },
        }),
      );
    }

    await next();
  });

  callbackDataProvider.handle('notificationResponse', async (ctx) => {
    await ctx.respondWith(
      new NotificationResponse({
        text: 'Notification response',
      }),
    );
  });

  callbackDataProvider.handle('alertResponse', async (ctx) => {
    await ctx.respondWith(
      new NotificationResponse({
        text: 'Alert response',
        showAlert: true,
      }),
    );
  });

  callbackDataProvider.handle('editTextResponse', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: 'Edited text response',
        replyMarkup: await callbackDataProvider.buildInlineKeyboard(inlineKeyboard),
      }),
    );
  });

  messageProvider.use(commandsProvider);
  updatesProvider.handle('callback_query', callbackDataProvider);

  bot.use(messageProvider);
  bot.use(updatesProvider);

  await bot.api.setMyCommands({
    commands: commandsProvider.prepareCommands(commands),
  });
};

export default initBot;
