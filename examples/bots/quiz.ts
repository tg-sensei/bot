import { MessageAction as LibMessageAction, Markdown, MemoryJsonUserDataProvider, TelegramBot } from '../../lib';
import { CreateBot } from '../runExample';

const commands = {
  '/simple_quiz': 'Simple quiz',
};

type BotCommand = keyof typeof commands;

type UserData =
  | {
      state: 'none';
    }
  | {
      state: 'simple:get-name';
    }
  | {
      state: 'simple:get-age';
      name: string;
    }
  | {
      state: 'simple:get-location';
      name: string;
      age: number;
    };

const MessageAction = LibMessageAction<BotCommand, never, UserData>;

const createBot: CreateBot<BotCommand, never, UserData> = (token) => {
  const userDataProvider = new MemoryJsonUserDataProvider<BotCommand, never, UserData>({
    defaultValue: {
      state: 'none',
    },
  });
  const bot = new TelegramBot({
    token,
    commands,
    userDataProvider,
  });

  bot.handleCommand('/simple_quiz', async ({ user }) => {
    if (!user) {
      return;
    }

    await userDataProvider.setUserData(user.id, {
      state: 'simple:get-name',
    });

    return new MessageAction({
      content: "What's your name?",
    });
  });

  userDataProvider.handle('simple:get-name', async ({ user, message }) => {
    const { text } = message;

    if (!text) {
      return new MessageAction({
        content: 'Please send a text message',
      });
    }

    await userDataProvider.setUserData(user.id, {
      state: 'simple:get-age',
      name: text,
    });

    return new MessageAction({
      content: "What's your age?",
    });
  });

  userDataProvider.handle('simple:get-age', async ({ user, message }) => {
    const { text } = message;

    if (!text) {
      return new MessageAction({
        content: 'Please send a text message',
      });
    }

    const age = Number(text);

    if (Number.isNaN(age)) {
      return new MessageAction({
        content: 'Please enter a valid number',
      });
    }

    if (age <= 0) {
      return new MessageAction({
        content: 'Age must be a positive number',
      });
    }

    await userDataProvider.setUserData(user.id, {
      state: 'simple:get-location',
      name: user.data.name,
      age,
    });

    return new MessageAction({
      content: 'Where do you live?',
    });
  });

  userDataProvider.handle('simple:get-location', async ({ user, message }) => {
    const { text } = message;

    if (!text) {
      return new MessageAction({
        content: 'Please send a text message',
      });
    }

    await userDataProvider.setUserData(user.id, {
      state: 'none',
    });

    return new MessageAction({
      content: Markdown.create`${Markdown.bold('Your name:')} ${user.data.name}
${Markdown.bold('Your age:')} ${user.data.age}
${Markdown.bold('Your location:')} ${text}`,
    });
  });

  return bot;
};

export default createBot;
