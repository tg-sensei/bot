import { AnyUpdateContext } from '../context';
import { BaseJsonCallbackData, BaseJsonCallbackDataType } from './JsonCallbackDataProvider';
import { JsonStorageCallbackDataProvider } from './JsonStorageCallbackDataProvider';

export class MemoryJsonStorageCallbackDataProvider<
  CallbackData extends BaseJsonCallbackData<BaseJsonCallbackDataType>,
  InputContext extends AnyUpdateContext,
> extends JsonStorageCallbackDataProvider<CallbackData, InputContext> {
  private readonly _callbackDataMap = new Map<string, CallbackData>();

  constructor() {
    super({
      getData: (dataId) => this._callbackDataMap.get(dataId) ?? null,
      setData: (dataId, data) => {
        if (data) {
          this._callbackDataMap.set(dataId, data);
        } else {
          this._callbackDataMap.delete(dataId);
        }
      },
      clearData: () => {
        this._callbackDataMap.clear();
      },
    });
  }
}
