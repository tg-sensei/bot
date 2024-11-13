import { AnyUpdateContext } from '../context';
import { Response } from './Response';

export type ResponsesStreamResponseGetResponses = () => AsyncGenerator<Response | null | undefined | void>;

export class ResponsesStreamResponse implements Response {
  private readonly _getResponses: ResponsesStreamResponseGetResponses;

  constructor(getResponses: ResponsesStreamResponseGetResponses) {
    this._getResponses = getResponses;
  }

  async respond(ctx: AnyUpdateContext): Promise<void> {
    for await (const response of this._getResponses()) {
      await response?.respond(ctx);
    }
  }
}
