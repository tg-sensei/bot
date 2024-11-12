import { performance } from 'node:perf_hooks';

import { TelegramBot as LibTelegramBot } from 'typescript-telegram-bot-api';

import { BaseCommand } from '../TelegramBot';
import { MaybePromise } from '../types';
import { PromiseWithResolvers, delay, promiseWithResolvers } from '../utils';
import { Response, ResponseOnMessage, ResponseOnMessageContext } from './Response';

export type WaitingResponseType = Parameters<LibTelegramBot['sendChatAction']>[0]['action'];

export type WaitingResponseMode = 'oneTime' | 'waitForResponse';

export type WaitingResponseOptions<CommandType extends BaseCommand, CallbackData, UserData> = {
  type: WaitingResponseType;
  mode?: WaitingResponseMode;
  businessConnectionId?: string;
  getResponse: () => MaybePromise<ResponseOnMessage<CommandType, CallbackData, UserData> | null | undefined | void>;
};

/* eslint-disable brace-style */
export class WaitingResponse<CommandType extends BaseCommand = never, CallbackData = never, UserData = never>
  implements Response<CommandType, CallbackData, UserData>
{
  /* eslint-enable brace-style */
  private readonly _getResponse: WaitingResponseOptions<CommandType, CallbackData, UserData>['getResponse'];

  readonly type: WaitingResponseType;
  readonly mode: WaitingResponseMode;
  readonly businessConnectionId?: string;

  constructor(options: WaitingResponseOptions<CommandType, CallbackData, UserData>) {
    this.type = options.type;
    this.mode = options.mode ?? 'waitForResponse';
    this.businessConnectionId = options.businessConnectionId;
    this._getResponse = options.getResponse;
  }

  async onMessage(ctx: ResponseOnMessageContext<CommandType, CallbackData, UserData>): Promise<void> {
    let promise: PromiseWithResolvers<void> | undefined;
    let responseSent = false;

    await Promise.all([
      (async () => {
        try {
          const response = await this._getResponse();

          await response?.onMessage(ctx);
        } finally {
          responseSent = true;

          promise?.resolve();
        }
      })(),
      (async () => {
        while (!responseSent) {
          const timestamp = performance.now();

          await ctx.bot.api.sendChatAction({
            chat_id: ctx.message.chat.id,
            message_thread_id: ctx.message.message_thread_id,
            business_connection_id: this.businessConnectionId,
            action: this.type,
          });

          if (responseSent || this.mode === 'oneTime') {
            break;
          }

          promise = promiseWithResolvers();

          await Promise.race([
            promise.promise,
            (async () => {
              const elapsed = performance.now() - timestamp;

              await delay(Math.max(0, 4000 - elapsed));
            })(),
          ]);
        }
      })(),
    ]);
  }
}
