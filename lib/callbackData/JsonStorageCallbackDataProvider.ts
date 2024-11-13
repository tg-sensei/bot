import { randomUUID } from 'node:crypto';

import { AnyUpdateContext } from '../context';
import { MaybePromise } from '../types';
import { BaseJsonCallbackData, BaseJsonCallbackDataType, JsonCallbackDataProvider } from './JsonCallbackDataProvider';

export type JsonStorageCallbackDataProviderOptions<CallbackData> = {
  getData: (dataId: string) => MaybePromise<CallbackData | null>;
  setData: (dataId: string, data: CallbackData | null) => unknown;
  clearData: () => unknown;
};

export class JsonStorageCallbackDataProvider<
  CallbackData extends BaseJsonCallbackData<BaseJsonCallbackDataType>,
  InputContext extends AnyUpdateContext,
> extends JsonCallbackDataProvider<CallbackData, InputContext> {
  private readonly _getData: JsonStorageCallbackDataProviderOptions<CallbackData>['getData'];
  private readonly _setData: JsonStorageCallbackDataProviderOptions<CallbackData>['setData'];
  private readonly _clearData: JsonStorageCallbackDataProviderOptions<CallbackData>['clearData'];

  constructor(options: JsonStorageCallbackDataProviderOptions<CallbackData>) {
    super();

    this._getData = options.getData;
    this._setData = options.setData;
    this._clearData = options.clearData;
  }

  async clear(): Promise<void> {
    await this._clearData();
  }

  parseCallbackData(dataString: string): MaybePromise<CallbackData | null> {
    return this._getData(dataString);
  }

  async stringifyData(data: CallbackData): Promise<string> {
    const dataId = randomUUID();

    await this._setData(dataId, data);

    return dataId;
  }
}
