import * as fs from 'node:fs';
import path from 'node:path';

import { z } from 'zod';

import {
  CommandsProvider,
  MemoryJsonStorageCallbackDataProvider,
  MessageResponse,
  ProviderContext,
  ResponsesStreamResponse,
  UpdatesContextByType,
  UpdatesProvider,
  UserProvider,
  WaitingResponse,
} from '../../lib';
import { InitBot } from '../runExample';

const commands = {
  '/create_sticker_set': 'Create sticker set',
};

type BotCommand = keyof typeof commands;

const callbackData = z.object({
  type: z.literal('deleteSet'),
  name: z.string(),
});

type CallbackData = z.TypeOf<typeof callbackData>;

const initBot: InitBot = async (bot) => {
  const updatesProvider = new UpdatesProvider();
  const userProvider = new UserProvider<UpdatesContextByType<'message'>>();
  const commandsProvider = new CommandsProvider<BotCommand, ProviderContext<typeof userProvider>>();
  const callbackDataProvider = new MemoryJsonStorageCallbackDataProvider<
    CallbackData,
    UpdatesContextByType<'callback_query'>
  >();

  commandsProvider.handle('/create_sticker_set', async (ctx, next) => {
    const user = ctx.message.from;

    if (!user) {
      return next();
    }

    await ctx.respondWith(
      new WaitingResponse({
        type: 'choose_sticker',
        getResponse: async () => {
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

          return new ResponsesStreamResponse(async function* () {
            yield new MessageResponse({
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
              yield new MessageResponse({
                mode: 'separate',
                content: {
                  type: 'sticker',
                  sticker,
                },
              });
            }
          });
        },
      }),
    );
  });

  callbackDataProvider.handle('deleteSet', async (ctx) => {
    await bot.api.deleteStickerSet({
      name: ctx.callbackData.name,
    });

    await ctx.respondWith(
      new MessageResponse({
        content: 'Set deleted',
      }),
    );
  });

  userProvider.use(commandsProvider);

  updatesProvider.handle('message', userProvider);
  updatesProvider.handle('callback_query', callbackDataProvider);

  bot.use(updatesProvider);

  await bot.api.setMyCommands({
    commands: commandsProvider.prepareCommands(commands),
  });
};

export default initBot;
