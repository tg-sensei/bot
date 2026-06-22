import { z } from 'zod';

import {
  InlineKeyboard,
  JsonCallbackDataProvider,
  MessageAction as LibMessageAction,
  Markdown,
  NotificationAction,
  ReplyKeyboard,
  TelegramBot,
} from '../../lib';
import { CreateBot } from '../runExample';

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

const MessageAction = LibMessageAction<BotCommand, CallbackData>;

const inlineKeyboard: InlineKeyboard<CallbackData> = [
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

const createBot: CreateBot<BotCommand, CallbackData> = (token) => {
  const callbackDataProvider = new JsonCallbackDataProvider<BotCommand, CallbackData>({
    parseJson: (json) => callbackData.parse(JSON.parse(json)),
  });
  const bot = new TelegramBot({
    token,
    commands,
    callbackDataProvider,
  });

  bot.handleCommand('/example_inline', async () => {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Inline keyboard example',
      },
      replyMarkup: inlineKeyboard,
    });
  });

  bot.handleCommand('/example_reply', async () => {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Reply keyboard example',
      },
      replyMarkup: replyKeyboard,
    });
  });

  bot.handleUsersShared(async ({ usersShared: { users } }) => {
    return new MessageAction({
      content: {
        type: 'text',
        text: Markdown.create`You've shared: ${Markdown.join(
          users.map(({ user_id, first_name }) => Markdown.telegramUser(user_id, first_name ?? `user${user_id}`)),
          ', ',
        )}`,
      },
    });
  });

  bot.handleChatShared(async ({ chatShared: { chat_id, title } }) => {
    return new MessageAction({
      content: {
        type: 'text',
        text: `You've shared chat (#${chat_id}) with title ${JSON.stringify(title)}`,
      },
    });
  });

  bot.handleMessage(async ({ message }) => {
    const { contact, location, poll, text } = message;

    if (contact) {
      return new MessageAction({
        content: {
          type: 'text',
          text: `You've shared a contact: ${contact.first_name} (${contact.phone_number})`,
        },
      });
    }

    if (poll) {
      return new MessageAction({
        content: {
          type: 'text',
          text: `You've shared a poll: ${poll.question}`,
        },
      });
    }

    if (location) {
      return new MessageAction({
        content: {
          type: 'text',
          text: `You've shared a location: ${location.latitude}, ${location.longitude}`,
        },
      });
    }

    if (text === closeKeyboardText) {
      return new MessageAction({
        content: {
          type: 'text',
          text: 'Keyboard closed',
        },
        replyMarkup: {
          remove_keyboard: true,
        },
      });
    }
  });

  callbackDataProvider.handle('notificationResponse', async () => {
    return new NotificationAction({
      text: 'Notification response',
    });
  });

  callbackDataProvider.handle('alertResponse', async () => {
    return new NotificationAction({
      text: 'Alert response',
      showAlert: true,
    });
  });

  callbackDataProvider.handle('editTextResponse', async () => {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Edited text response',
      },
      replyMarkup: inlineKeyboard,
    });
  });

  return bot;
};

export default createBot;
