import { TelegramBotError, TelegramBotErrorCode } from '../TelegramBotError';
import { AnyUpdateContext } from '../context';
import { Response } from './Response';

export interface NotificationResponseOptions {
  text: string;
  showAlert?: boolean;
  url?: string;
  cacheTime?: number;
}

export class NotificationResponse implements Response {
  private readonly text: string;
  private readonly showAlert?: boolean;
  private readonly url?: string;
  private readonly cacheTime?: number;

  constructor(options: NotificationResponseOptions) {
    this.text = options.text;
    this.showAlert = options.showAlert;
    this.url = options.url;
    this.cacheTime = options.cacheTime;
  }

  async respond(ctx: AnyUpdateContext): Promise<void> {
    if (ctx.update.type !== 'callback_query') {
      return;
    }

    if (this.text.length > 200) {
      throw new TelegramBotError(TelegramBotErrorCode.LongNotificationText, {
        message: `Notification text is too long: ${JSON.stringify(this.text)}`,
      });
    }

    await ctx.bot.api.answerCallbackQuery({
      callback_query_id: ctx.update.callbackQuery.id,
      text: this.text,
      show_alert: this.showAlert,
      url: this.url,
      cache_time: this.cacheTime,
    });

    ctx.responseSent = true;
  }
}
