import { TypedCallback } from './Callback';

type ListXAttributesCallback = TypedCallback<Array<string>>;

export class ListXAttributes {
  async execute(_path: string, cb: ListXAttributesCallback): Promise<void> {
    cb(0, []);
  }
}
