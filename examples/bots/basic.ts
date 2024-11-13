import { createReadStream } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import {
  CommandsProvider,
  GeoPoint,
  Markdown,
  MessageProvider,
  MessageReactionResponse,
  MessageResponse,
  NotificationResponse,
  ProviderContext,
  ResponsesBatchResponse,
  ResponsesStreamResponse,
  StringCallbackDataProvider,
  UpdatesContextByType,
  UpdatesProvider,
  WaitingResponse,
} from '../../lib';
import { delay } from '../../lib/utils';
import { InitBot } from '../runExample';

const commands = {
  '/start': undefined,
  '/simple': 'Simple text',
  '/markdown': 'Markdown',
  '/photo': 'Photo',
  '/audio': 'Audio',
  '/document': 'Document',
  '/large_document': 'Large document',
  '/video': 'Video',
  '/animation': 'Animation',
  '/voice': 'Voice',
  '/video_note': 'Video note',
  '/paid_media': 'Paid media',
  '/media_group': 'Media group',
  '/location': 'Location',
  '/live_location': 'Live location',
  '/venue': 'Venue',
  '/contact': 'Contact',
  '/dice': 'Dice',
  '/poll': 'Poll',
  '/quiz': 'Quiz',
  '/sticker': 'Sticker',
  '/reaction': 'Random reaction',
  '/notification_showcase': 'Notification showcase',
};

type BotCommand = keyof typeof commands;

type CallbackData =
  | 'editSimpleText'
  | 'editPhoto'
  | 'editAudio'
  | 'readDocument'
  | 'editDocument'
  | 'editDocumentWithPhoto'
  | 'editVideo'
  | 'editAnimation'
  | 'startMoving'
  | 'stopMoving'
  | 'responseWithNotification'
  | 'responseWithNotificationAlert'
  | 'responseWithNotificationAndText';

const reactionsPool = ['👍', '👎', '❤', '🔥', '🥰', '👏', '😁', '🤔', '🤯', '😱', '🤬', '😢', '🎉'] as const;
const dicePool = ['🎲', '🎯', '🏀', '⚽', '🎳', '🎰'] as const;
const effectsPool = ['👍', '👎', '❤️', '🔥', '🎉', '💩'] as const;

const liveStartCoord: GeoPoint = {
  latitude: 56.837266,
  longitude: 60.594541,
};

const liveEndCoord: GeoPoint = {
  latitude: 56.839061,
  longitude: 60.61151,
};

const liveDuration = 60 * 1000;

const getCurrentCoord = (timeElapsed: number): GeoPoint => {
  return {
    latitude:
      liveStartCoord.latitude +
      (liveEndCoord.latitude - liveStartCoord.latitude) * Math.min(1, timeElapsed / liveDuration),
    longitude:
      liveStartCoord.longitude +
      (liveEndCoord.longitude - liveStartCoord.longitude) * Math.min(1, timeElapsed / liveDuration),
  };
};

const initBot: InitBot = async (bot) => {
  const updatesProvider = new UpdatesProvider();
  const commandsProvider = new CommandsProvider<BotCommand, UpdatesContextByType<'message'>>();
  const messageProvider = new MessageProvider<UpdatesContextByType<'callback_query'>>();
  const callbackDataProvider = new StringCallbackDataProvider<CallbackData, ProviderContext<typeof messageProvider>>();

  commandsProvider.handle('/start', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: 'Hi',
      }),
    );
  });

  commandsProvider.handle('/simple', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: 'Simple text response',
        replyMarkup: await callbackDataProvider.buildInlineKeyboard([
          [
            {
              type: 'callbackData',
              text: 'Edit text',
              callbackData: 'editSimpleText',
            },
          ],
        ]),
        messageEffect: effectsPool[Math.floor(Math.random() * effectsPool.length)],
      }),
    );
  });

  commandsProvider.handle('/markdown', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: Markdown.create`plain text

${Markdown.bold('bold')}

${Markdown.italic('italic')}

${Markdown.bold(Markdown.italic('bold italic'))}

${Markdown.italic(Markdown.bold('italic bold'))}

${Markdown.italic(Markdown.underline('italic underline'))}

${Markdown.underline(Markdown.italic('underline italic'))}

${Markdown.strikethrough('strikethrough')}

${Markdown.fixedWidth('*fixed width*')}

${Markdown.code(
  null,
  `no language code
with multiple rows`,
)}

${Markdown.code(
  'json',
  `{
  "json": "code",
  "key": 0
}`,
)}

${Markdown.spoiler(Markdown.create`123 ${Markdown.bold(456)} 789`)}

${Markdown.url('https://google.com', 'Google')}

${Markdown.telegramUser(493571366, 'tg:droooney')}

${Markdown.blockquote(`blockquote start
blockquote row 1
blockquote row 2
blockquote row 3
blockquote row 4
blockquote row 5
blockquote row 6
blockquote row 7
blockquote row 8
blockquote row 9`)}

${Markdown.blockquote(
  `expandable blockquote start
blockquote row 1
blockquote row 2
blockquote row 3
blockquote row 4
blockquote row 5
blockquote row 6
blockquote row 7
blockquote row 8
blockquote row 9`,
  true,
)}
`,
      }),
    );
  });

  commandsProvider.handle('/photo', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'photo',
          photo: createReadStream(path.resolve('./examples/assets/house.png')),
          text: Markdown.create`caption with ${Markdown.bold('bold')} text`,
        },
        replyMarkup: await callbackDataProvider.buildInlineKeyboard([
          [
            {
              type: 'callbackData',
              text: 'Edit photo',
              callbackData: 'editPhoto',
            },
          ],
        ]),
      }),
    );
  });

  commandsProvider.handle('/audio', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'audio',
          audio: createReadStream(path.resolve('./examples/assets/audio1.mp3')),
          text: Markdown.create`caption with ${Markdown.bold('bold')} text`,
          performer: 'Cool performer',
          title: 'Cool title',
          thumbnail: createReadStream(path.resolve('./examples/assets/thumb1.png')),
        },
        replyMarkup: await callbackDataProvider.buildInlineKeyboard([
          [
            {
              type: 'callbackData',
              text: 'Edit audio',
              callbackData: 'editAudio',
            },
          ],
        ]),
      }),
    );
  });

  commandsProvider.handle('/document', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'document',
          document: createReadStream(path.resolve('./examples/assets/file1.txt')),
          text: Markdown.create`caption with ${Markdown.bold('bold')} text`,
        },
        replyMarkup: await callbackDataProvider.buildInlineKeyboard([
          [
            {
              type: 'callbackData',
              text: 'Read document',
              callbackData: 'readDocument',
            },
          ],
          [
            {
              type: 'callbackData',
              text: 'Edit document',
              callbackData: 'editDocument',
            },
          ],
          [
            {
              type: 'callbackData',
              text: 'Edit document with photo',
              callbackData: 'editDocumentWithPhoto',
            },
          ],
        ]),
      }),
    );
  });

  commandsProvider.handle('/large_document', async (ctx) => {
    await ctx.respondWith(
      new WaitingResponse({
        type: 'upload_document',
        getResponse: () =>
          new MessageResponse({
            content: {
              type: 'document',
              document: createReadStream(path.resolve('./examples/assets/video0.mp4')),
            },
          }),
      }),
    );
  });

  commandsProvider.handle('/video', async (ctx) => {
    await ctx.respondWith(
      new WaitingResponse({
        type: 'upload_video',
        getResponse: async () =>
          new MessageResponse({
            content: {
              type: 'video',
              video: createReadStream(path.resolve('./examples/assets/video1.mp4')),
              text: Markdown.create`caption with ${Markdown.bold('bold')} text`,
              thumbnail: createReadStream(path.resolve('./examples/assets/thumb1.png')),
            },
            replyMarkup: await callbackDataProvider.buildInlineKeyboard([
              [
                {
                  type: 'callbackData',
                  text: 'Edit video',
                  callbackData: 'editVideo',
                },
              ],
            ]),
          }),
      }),
    );
  });

  commandsProvider.handle('/animation', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'animation',
          animation: createReadStream(path.resolve('./examples/assets/animation1.gif')),
          text: Markdown.create`caption with ${Markdown.bold('bold')} text`,
          thumbnail: createReadStream(path.resolve('./examples/assets/thumb1.png')),
        },
        replyMarkup: await callbackDataProvider.buildInlineKeyboard([
          [
            {
              type: 'callbackData',
              text: 'Edit animation',
              callbackData: 'editAnimation',
            },
          ],
        ]),
      }),
    );
  });

  commandsProvider.handle('/voice', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'voice',
          voice: createReadStream(path.resolve('./examples/assets/audio1.mp3')),
          text: Markdown.create`caption with ${Markdown.bold('bold')} text`,
        },
      }),
    );
  });

  commandsProvider.handle('/video_note', async (ctx) => {
    await ctx.respondWith(
      new WaitingResponse({
        type: 'upload_video_note',
        getResponse: () =>
          new MessageResponse({
            content: {
              type: 'videoNote',
              videoNote: createReadStream(path.resolve('./examples/assets/video_note.mp4')),
              thumbnail: createReadStream(path.resolve('./examples/assets/thumb1.png')),
            },
          }),
      }),
    );
  });

  commandsProvider.handle('/paid_media', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'paidMedia',
          starCount: 1,
          media: [
            {
              type: 'photo',
              media: createReadStream(path.resolve('./examples/assets/house.png')),
            },
            {
              type: 'video',
              media: createReadStream(path.resolve('./examples/assets/video1.mp4')),
            },
          ],
        },
      }),
    );
  });

  commandsProvider.handle('/media_group', async (ctx) => {
    await ctx.respondWith(
      new WaitingResponse({
        type: 'upload_document',
        getResponse: () =>
          new MessageResponse({
            content: {
              type: 'mediaGroup',
              media: [
                {
                  type: 'photo',
                  media: createReadStream(path.resolve('./examples/assets/house.png')),
                },
                {
                  type: 'video',
                  media: createReadStream(path.resolve('./examples/assets/video1.mp4')),
                },
              ],
            },
          }),
      }),
    );
  });

  commandsProvider.handle('/location', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'location',
          point: {
            latitude: 56.7447061,
            longitude: 60.8036319,
          },
          horizontalAccuracy: 10,
        },
      }),
    );
  });

  commandsProvider.handle('/live_location', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'location',
          point: {
            latitude: liveStartCoord.latitude,
            longitude: liveStartCoord.longitude,
          },
          livePeriod: 5 * 60 * 1000,
        },
        replyMarkup: await callbackDataProvider.buildInlineKeyboard([
          [
            {
              type: 'callbackData',
              text: 'Start moving',
              callbackData: 'startMoving',
            },
          ],
        ]),
      }),
    );
  });

  commandsProvider.handle('/venue', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'venue',
          point: {
            latitude: 56.7447061,
            longitude: 60.8036319,
          },
          title: 'Koltsovo Airport',
          address: "ul. Bahchivandji, 1, Yekaterinburg, Sverdlovskaya oblast', Russia, 620025",
          googlePlaceId: 'ChIJvQOvvuVBwUMRokF0eTgS0RA',
          googlePlaceType: 'airport',
        },
      }),
    );
  });

  commandsProvider.handle('/contact', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'contact',
          phoneNumber: '+71234567890',
          firstName: 'Jimmy',
          lastName: 'Baxter',
        },
      }),
    );
  });

  commandsProvider.handle('/dice', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'dice',
          emoji: dicePool[Math.floor(Math.random() * dicePool.length)],
        },
      }),
    );
  });

  commandsProvider.handle('/poll', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'poll',
          question: 'How are you feeling?',
          options: ['Good!', 'Very good!'],
          openPeriod: 20 * 1000,
        },
      }),
    );
  });

  commandsProvider.handle('/quiz', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'poll',
          pollType: 'quiz',
          question: 'What is 2 * 2?',
          options: ['4', '5'],
          correctOptionId: 0,
          explanation: 'Everyone knows that 2 * 2 = 4',
        },
      }),
    );
  });

  commandsProvider.handle('/sticker', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'sticker',
          sticker: 'CAACAgIAAxkBAAO8Zu4QdD3371GUb8FesINmN-A8pWcAAgEAA8A2TxMYLnMwqz8tUTYE',
        },
      }),
    );
  });

  commandsProvider.handle('/reaction', async (ctx) => {
    await ctx.respondWith(
      new MessageReactionResponse({
        reaction: {
          type: 'emoji',
          emoji: reactionsPool[Math.floor(Math.random() * reactionsPool.length)],
        },
        isBig: Math.random() < 0.5,
      }),
    );
  });

  commandsProvider.handle('/notification_showcase', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: 'Notification showcase',
        replyMarkup: await callbackDataProvider.buildInlineKeyboard([
          [
            {
              type: 'callbackData',
              text: 'Notification response',
              callbackData: 'responseWithNotification',
            },
          ],
          [
            {
              type: 'callbackData',
              text: 'Alert response',
              callbackData: 'responseWithNotificationAlert',
            },
          ],
          [
            {
              type: 'callbackData',
              text: 'Notification + text response',
              callbackData: 'responseWithNotificationAndText',
            },
          ],
        ]),
      }),
    );
  });

  callbackDataProvider.handle('editSimpleText', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: 'edited text',
      }),
    );
  });

  callbackDataProvider.handle(['editPhoto', 'editDocumentWithPhoto'], async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'photo',
          photo: createReadStream(path.resolve('./examples/assets/house_heart.png')),
          text: Markdown.create`edited caption with ${Markdown.bold('bold')} text`,
          showCaptionAboveMedia: true,
          hasSpoiler: true,
        },
      }),
    );
  });

  callbackDataProvider.handle('editAudio', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'audio',
          audio: createReadStream(path.resolve('./examples/assets/audio2.mp3')),
          text: Markdown.create`edited caption with ${Markdown.bold('bold')} text`,
          performer: 'New performer',
          title: 'New title',
          thumbnail: createReadStream(path.resolve('./examples/assets/thumb2.png')),
        },
      }),
    );
  });

  callbackDataProvider.handle('readDocument', async (ctx) => {
    const { document } = ctx.message;

    if (!document) {
      return ctx.respondWith(
        new NotificationResponse({
          text: 'No document',
        }),
      );
    }

    const filePath = path.resolve(`./examples/downloads/${document.file_id}`);

    await bot.downloadFile({
      fileId: document.file_id,
      path: filePath,
    });

    const fileContent = await readFile(filePath, 'utf8');

    await rm(filePath);

    await ctx.respondWith(
      new NotificationResponse({
        text: `Text from document: ${JSON.stringify(fileContent)}`,
      }),
    );
  });

  callbackDataProvider.handle('editDocument', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'document',
          document: createReadStream(path.resolve('./examples/assets/file2.txt')),
          text: Markdown.create`edited caption with ${Markdown.bold('bold')} text`,
        },
      }),
    );
  });

  callbackDataProvider.handle('editVideo', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'video',
          video: createReadStream(path.resolve('./examples/assets/video2.mp4')),
          text: Markdown.create`edited caption with ${Markdown.bold('bold')} text`,
          thumbnail: createReadStream(path.resolve('./examples/assets/thumb2.png')),
          showCaptionAboveMedia: true,
          hasSpoiler: true,
        },
      }),
    );
  });

  callbackDataProvider.handle('editAnimation', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'animation',
          animation: createReadStream(path.resolve('./examples/assets/animation2.gif')),
          text: Markdown.create`edited caption with ${Markdown.bold('bold')} text`,
          thumbnail: createReadStream(path.resolve('./examples/assets/thumb2.png')),
          showCaptionAboveMedia: true,
          hasSpoiler: true,
        },
      }),
    );
  });

  callbackDataProvider.handle('startMoving', async (ctx) => {
    await ctx.respondWith(
      new ResponsesStreamResponse(async function* () {
        yield new MessageResponse({
          content: {
            type: 'unmodified',
          },
          replyMarkup: await callbackDataProvider.buildInlineKeyboard([
            [
              {
                type: 'callbackData',
                text: 'Stop moving',
                callbackData: 'stopMoving',
              },
            ],
          ]),
        });

        const start = performance.now();

        while (true) {
          await delay(5000);

          const newPoint = getCurrentCoord(performance.now() - start);

          yield new MessageResponse({
            content: {
              type: 'location',
              point: newPoint,
            },
            replyMarkup: await callbackDataProvider.buildInlineKeyboard([
              [
                {
                  type: 'callbackData',
                  text: 'Stop moving',
                  callbackData: 'stopMoving',
                },
              ],
            ]),
          });

          if (
            Math.abs(newPoint.latitude - liveEndCoord.latitude) < Number.EPSILON &&
            Math.abs(newPoint.longitude - liveEndCoord.longitude) < Number.EPSILON
          ) {
            yield new MessageResponse({
              content: {
                type: 'location',
                point: null,
              },
            });

            break;
          }
        }
      }),
    );
  });

  callbackDataProvider.handle('stopMoving', async (ctx) => {
    await ctx.respondWith(
      new MessageResponse({
        content: {
          type: 'location',
          point: null,
        },
      }),
    );
  });

  callbackDataProvider.handle('responseWithNotification', async (ctx) => {
    await ctx.respondWith(
      new NotificationResponse({
        text: 'Notification response',
      }),
    );
  });

  callbackDataProvider.handle('responseWithNotificationAlert', async (ctx) => {
    await ctx.respondWith(
      new NotificationResponse({
        text: 'Alert response',
        showAlert: true,
      }),
    );
  });

  callbackDataProvider.handle('responseWithNotificationAndText', async (ctx) => {
    await ctx.respondWith(
      new ResponsesBatchResponse(() => [
        new MessageResponse({
          content: 'Text response',
        }),
        new NotificationResponse({
          text: 'Notification response',
        }),
      ]),
    );
  });

  messageProvider.use(callbackDataProvider);

  updatesProvider.handle('message', commandsProvider);
  updatesProvider.handle('callback_query', messageProvider);

  bot.use(updatesProvider);

  await bot.api.setMyCommands({
    commands: commandsProvider.prepareCommands(commands),
  });
};

export default initBot;
