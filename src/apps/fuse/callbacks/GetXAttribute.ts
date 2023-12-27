import Logger from 'electron-log';
import { TypedCallback } from './Callback';

type GetXAttributeCallback = TypedCallback<Buffer>;

export class GetXAttribute {
  async export(
    path: string,
    name: string,
    size: string,
    cb: GetXAttributeCallback
  ): Promise<void> {
    Logger.debug('GETXATTR', path, name, size, cb);

    const buff = Buffer.from('in sync');
    cb(0, buff);
  }
}
