import {
  CommandsProvider,
  Markdown,
  MemoryJsonUserDataProvider,
  MessageResponse,
  ProviderContext,
  UpdatesContextByType,
  UpdatesProvider,
  UserProvider,
} from '../../lib';
import { InitBot } from '../runExample';

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

const initBot: InitBot = async (bot) => {
  const updatesProvider = new UpdatesProvider();
  const userProvider = new UserProvider<UpdatesContextByType<'message'>>();
  const commandsProvider = new CommandsProvider<BotCommand, ProviderContext<typeof userProvider>>();
  const userDataProvider = new MemoryJsonUserDataProvider<UserData, UpdatesContextByType<'message'>>({
    defaultValue: {
      state: 'none',
    },
  });

  commandsProvider.handle('/simple_quiz', async (ctx) => {
    await userDataProvider.setUserData(ctx.user.id, {
      state: 'simple:get-name',
    });

    await ctx.respondWith(
      new MessageResponse({
        content: "What's your name?",
      }),
    );
  });

  userDataProvider.handle('simple:get-name', async (ctx) => {
    const {
      user,
      message: { text },
    } = ctx;

    if (!text) {
      return ctx.respondWith(
        new MessageResponse({
          content: 'Please send a text message',
        }),
      );
    }

    await userDataProvider.setUserData(user.id, {
      state: 'simple:get-age',
      name: text,
    });

    await ctx.respondWith(
      new MessageResponse({
        content: "What's your age?",
      }),
    );
  });

  userDataProvider.handle('simple:get-age', async (ctx) => {
    const {
      user,
      message: { text },
    } = ctx;

    if (!text) {
      return ctx.respondWith(
        new MessageResponse({
          content: 'Please send a text message',
        }),
      );
    }

    const age = Number(text);

    if (Number.isNaN(age)) {
      return ctx.respondWith(
        new MessageResponse({
          content: 'Please enter a valid number',
        }),
      );
    }

    if (age <= 0) {
      return ctx.respondWith(
        new MessageResponse({
          content: 'Age must be a positive number',
        }),
      );
    }

    await userDataProvider.setUserData(user.id, {
      state: 'simple:get-location',
      name: user.data.name,
      age,
    });

    await ctx.respondWith(
      new MessageResponse({
        content: 'Where do you live?',
      }),
    );
  });

  userDataProvider.handle('simple:get-location', async (ctx) => {
    const {
      user,
      message: { text },
    } = ctx;

    if (!text) {
      return ctx.respondWith(
        new MessageResponse({
          content: 'Please send a text message',
        }),
      );
    }

    await userDataProvider.setUserData(user.id, {
      state: 'none',
    });

    await ctx.respondWith(
      new MessageResponse({
        content: Markdown.create`${Markdown.bold('Your name:')} ${user.data.name}
${Markdown.bold('Your age:')} ${user.data.age}
${Markdown.bold('Your location:')} ${text}`,
      }),
    );
  });

  userProvider.use(commandsProvider);

  updatesProvider.handle('message', userProvider);
  updatesProvider.handle('message', userDataProvider);

  bot.use(updatesProvider);

  await bot.api.setMyCommands({
    commands: commandsProvider.prepareCommands(commands),
  });
};

export default initBot;
