import { AnyUpdateContext } from '../context';
import { Response } from './Response';

export type ResponsesBatchResponseGetResponses = () => Iterable<Response | null | undefined | void>;

export class ResponsesBatchResponse implements Response {
  private readonly _getResponses: ResponsesBatchResponseGetResponses;

  constructor(getResponses: ResponsesBatchResponseGetResponses) {
    this._getResponses = getResponses;
  }

  async respond(ctx: AnyUpdateContext): Promise<void> {
    await Promise.all(
      function* (this: ResponsesBatchResponse) {
        for (const response of this._getResponses()) {
          yield response?.respond(ctx);
        }
      }.call(this),
    );
  }
}
