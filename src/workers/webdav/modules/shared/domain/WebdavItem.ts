import { WebdavFile } from '../../files/domain/WebdavFile';
import { Folder } from '../../folders/domain/Folder';
import { WebdavPath } from './WebdavPath';

export abstract class WebdavItem {
  abstract readonly path: WebdavPath;

  abstract readonly createdAt: Date;

  abstract readonly updatedAt: Date;

  abstract readonly size: number;

  abstract rename(path: WebdavPath): WebdavItem;
  abstract moveTo(folder: Folder): WebdavItem;

  abstract isFolder(): this is Folder;
  abstract isFile(): this is WebdavFile;
  abstract hasParent(id: number): boolean;
  abstract toProps(): Record<string, string | number>;
}
