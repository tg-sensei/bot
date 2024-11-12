import { BaseCommand } from '../TelegramBot';
import { Response, ResponseOnCallbackQueryContext, ResponseOnMessageContext } from './Response';

export type ResponsesStreamResponseGetResponses<
  CommandType extends BaseCommand,
  CallbackData,
  UserData,
> = () => AsyncGenerator<Response<CommandType, CallbackData, UserData> | null | undefined>;

/* eslint-disable brace-style */
export class ResponsesStreamResponse<CommandType extends BaseCommand = never, CallbackData = never, UserData = never>
  implements Response<CommandType, CallbackData, UserData>
{
  /* eslint-enable brace-style */
  private readonly _getResponses: ResponsesStreamResponseGetResponses<CommandType, CallbackData, UserData>;

  constructor(getResponses: ResponsesStreamResponseGetResponses<CommandType, CallbackData, UserData>) {
    this._getResponses = getResponses;
  }

  async onCallbackQuery(ctx: ResponseOnCallbackQueryContext<CommandType, CallbackData, UserData>): Promise<void> {
    for await (const response of this._getResponses()) {
      await response?.onCallbackQuery?.(ctx);
    }
  }

  async onMessage(ctx: ResponseOnMessageContext<CommandType, CallbackData, UserData>): Promise<void> {
    for await (const response of this._getResponses()) {
      await response?.onMessage?.(ctx);
    }
  }
}
