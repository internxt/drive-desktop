import { FuseCallback } from './FuseCallback';

type ListXAttributesCallbackData = Array<string>;

export class ListXAttributesCallback extends FuseCallback<ListXAttributesCallbackData> {
  async execute(_path: string) {
    return this.right([]);
  }
}
