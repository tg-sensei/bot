import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { TelegramBot } from '../lib';

export type InitBot = (bot: TelegramBot) => unknown;

(async () => {
  try {
    const token = process.env.TOKEN;

    if (!token) {
      throw new Error('No token');
    }

    const { select } = await import('@inquirer/prompts');

    const botExamples = await readdir(path.resolve(__dirname, './bots'));

    const example = await select({
      message: 'Select example',
      choices: botExamples.map((example) => {
        const value = example.replace(/\.ts$/, '');

        return {
          value,
          name: value.slice(0, 1).toUpperCase() + value.slice(1),
        };
      }),
    });

    const bot = new TelegramBot({
      token,
    });

    const { default: initBot }: { default: InitBot } = await import(`./bots/${example}`);

    await initBot(bot);
    await bot.start();

    console.log(`Bot ${JSON.stringify(example)} started`);
  } catch (err) {
    console.log(err);

    process.exit(1);
  }
})();
