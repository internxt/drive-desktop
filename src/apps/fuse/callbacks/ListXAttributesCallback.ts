import { FuseCallback } from './FuseCallback';

type ListXAttributesCallbackData = Array<string>;

export class ListXAttributesCallback extends FuseCallback<ListXAttributesCallbackData> {
  constructor() {
    super('List X Attributes');
  }

  async execute(_path: string) {
    return this.right([]);
  }
}
