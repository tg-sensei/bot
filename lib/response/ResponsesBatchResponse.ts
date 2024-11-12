import { BaseCommand } from '../TelegramBot';
import { Response, ResponseOnCallbackQueryContext, ResponseOnMessageContext } from './Response';

export type ResponsesBatchResponseGetResponses<
  CommandType extends BaseCommand,
  CallbackData,
  UserData,
> = () => Iterable<Response<CommandType, CallbackData, UserData> | null | undefined>;

/* eslint-disable brace-style */
export class ResponsesBatchResponse<CommandType extends BaseCommand = never, CallbackData = never, UserData = never>
  implements Response<CommandType, CallbackData, UserData>
{
  /* eslint-enable brace-style */
  private readonly _getResponses: ResponsesBatchResponseGetResponses<CommandType, CallbackData, UserData>;

  constructor(getResponses: ResponsesBatchResponseGetResponses<CommandType, CallbackData, UserData>) {
    this._getResponses = getResponses;
  }

  async onCallbackQuery(ctx: ResponseOnCallbackQueryContext<CommandType, CallbackData, UserData>): Promise<void> {
    await Promise.all(
      function* (this: ResponsesBatchResponse<CommandType, CallbackData, UserData>) {
        for (const response of this._getResponses()) {
          yield response?.onCallbackQuery?.(ctx);
        }
      }.call(this),
    );
  }

  async onMessage(ctx: ResponseOnMessageContext<CommandType, CallbackData, UserData>): Promise<void> {
    await Promise.all(
      function* (this: ResponsesBatchResponse<CommandType, CallbackData, UserData>) {
        for (const response of this._getResponses()) {
          yield response?.onMessage?.(ctx);
        }
      }.call(this),
    );
  }
}
