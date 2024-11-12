import * as fs from 'node:fs';
import path from 'node:path';

import { z } from 'zod';

import {
  ActionsStreamAction,
  MessageAction as LibMessageAction,
  MemoryJsonStorageCallbackDataProvider,
  TelegramBot,
  WaitingAction,
} from '../../lib';
import { CreateBot } from '../runExample';

const commands = {
  '/create_sticker_set': 'Create sticker set',
};

type BotCommand = keyof typeof commands;

const callbackData = z.object({
  type: z.literal('deleteSet'),
  name: z.string(),
});

type CallbackData = z.TypeOf<typeof callbackData>;

const MessageAction = LibMessageAction<BotCommand, CallbackData>;

const createBot: CreateBot<BotCommand, CallbackData> = (token) => {
  const callbackDataProvider = new MemoryJsonStorageCallbackDataProvider<BotCommand, CallbackData>();
  const bot = new TelegramBot({
    token,
    commands,
    callbackDataProvider,
  });

  bot.handleCommand('/create_sticker_set', async (ctx) => {
    const user = ctx.message.from;

    if (!user) {
      return;
    }

    return new WaitingAction({
      type: 'choose_sticker',
      getAction: async () => {
        const name = `test_${Math.random().toString().slice(2)}_by_${(await bot.api.getMe()).username}`;

        await bot.api.createNewStickerSet({
          user_id: user.id,
          name,
          title: 'Test Sticker Set',
          stickers: [
            {
              format: 'static',
              sticker: fs.createReadStream(path.resolve('./examples/assets/house.png')),
              emoji_list: ['😁'],
            },
            {
              format: 'static',
              sticker: fs.createReadStream(path.resolve('./examples/assets/house_heart.png')),
              emoji_list: ['😃'],
            },
            {
              format: 'static',
              sticker: fs.createReadStream(path.resolve('./examples/assets/house_trees.png')),
              emoji_list: ['😅'],
            },
          ],
        });

        return new ActionsStreamAction(async function* () {
          yield new MessageAction({
            content: 'Set created',
            replyMarkup: await callbackDataProvider.buildInlineKeyboard([
              [
                {
                  type: 'callbackData',
                  text: 'Delete set',
                  callbackData: {
                    type: 'deleteSet',
                    name,
                  },
                },
              ],
            ]),
          });

          const stickerSet = await bot.api.getStickerSet({
            name,
          });

          const sticker = stickerSet.stickers.at(0)?.file_id;

          if (sticker) {
            yield new MessageAction({
              mode: 'separate',
              content: {
                type: 'sticker',
                sticker,
              },
            });
          }
        });
      },
    });
  });

  callbackDataProvider.handle('deleteSet', async ({ data: { name } }) => {
    await bot.api.deleteStickerSet({
      name,
    });

    return new MessageAction({
      content: 'Set deleted',
    });
  });

  return bot;
};

export default createBot;
