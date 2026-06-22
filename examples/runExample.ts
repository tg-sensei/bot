import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { BaseCommand, TelegramBot } from '../lib';

export type CreateBot<CommandType extends BaseCommand = never, CallbackData = never, UserData = never> = (
  token: string,
) => TelegramBot<CommandType, CallbackData, UserData>;

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

    const { default: createBot }: { default: CreateBot<any, any, any> } = await import(`./bots/${example}`);
    const bot = createBot(token);

    await bot.start();

    console.log(`Bot ${JSON.stringify(example)} started`);
  } catch (err) {
    console.log(err);

    process.exit(1);
  }
})();
