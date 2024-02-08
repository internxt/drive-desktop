import Logger from 'electron-log';
import { FuseCallback } from './FuseCallback';

export class GetXAttributeCallback extends FuseCallback<Buffer> {
  async execute(path: string, name: string, size: string) {
    Logger.debug('GETXATTR', path, name, size);

    const buff = Buffer.from('in sync');

    return this.right(buff);
  }
}
