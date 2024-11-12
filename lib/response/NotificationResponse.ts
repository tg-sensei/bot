import { BaseCommand } from '../TelegramBot';
import { TelegramBotError, TelegramBotErrorCode } from '../TelegramBotError';
import { Response, ResponseOnCallbackQueryContext } from './Response';

export interface NotificationResponseOptions {
  text: string;
  showAlert?: boolean;
  url?: string;
  cacheTime?: number;
}

/* eslint-disable brace-style */
export class NotificationResponse<CommandType extends BaseCommand = never, CallbackData = never, UserData = never>
  implements Response<CommandType, CallbackData, UserData>
{
  /* eslint-enable brace-style */
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

  async onCallbackQuery(ctx: ResponseOnCallbackQueryContext<CommandType, CallbackData, UserData>): Promise<void> {
    if (this.text.length > 200) {
      throw new TelegramBotError(TelegramBotErrorCode.LongNotificationText, {
        message: `Notification text is too long: ${JSON.stringify(this.text)}`,
      });
    }

    await ctx.bot.api.answerCallbackQuery({
      callback_query_id: ctx.query.id,
      text: this.text,
      show_alert: this.showAlert,
      url: this.url,
      cache_time: this.cacheTime,
    });
  }
}
