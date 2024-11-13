import { performance } from 'node:perf_hooks';

import { SendChatActionOptions } from '../TelegramBot';
import { AnyUpdateContext } from '../context';
import { MaybePromise } from '../types';
import { PromiseWithResolvers, delay, promiseWithResolvers } from '../utils';
import { Response } from './Response';

export type WaitingResponseType = SendChatActionOptions['action'];

export type WaitingResponseMode = 'oneTime' | 'waitForResponse';

export type WaitingResponseOptions = {
  type: WaitingResponseType;
  mode?: WaitingResponseMode;
  businessConnectionId?: string;
  getResponse: () => MaybePromise<Response | null | undefined | void>;
};

export class WaitingResponse implements Response {
  private readonly _getResponse: WaitingResponseOptions['getResponse'];

  readonly type: WaitingResponseType;
  readonly mode: WaitingResponseMode;
  readonly businessConnectionId?: string;

  constructor(options: WaitingResponseOptions) {
    this.type = options.type;
    this.mode = options.mode ?? 'waitForResponse';
    this.businessConnectionId = options.businessConnectionId;
    this._getResponse = options.getResponse;
  }

  async respond(ctx: AnyUpdateContext): Promise<void> {
    const { update } = ctx;

    if (update.type !== 'message') {
      return;
    }

    let promise: PromiseWithResolvers<void> | undefined;
    let responseSent = false;

    await Promise.all([
      (async () => {
        try {
          const response = await this._getResponse();

          await response?.respond(ctx);
        } finally {
          responseSent = true;

          promise?.resolve();
        }
      })(),
      (async () => {
        while (!responseSent) {
          const timestamp = performance.now();

          await ctx.bot.sendChatAction({
            chatId: update.message.chat.id,
            messageThreadId: update.message.message_thread_id,
            businessConnectionId: this.businessConnectionId,
            action: this.type,
          });

          ctx.responseSent = true;

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
