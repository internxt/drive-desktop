import { WebdavFile } from '../../files/domain/WebdavFile';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavPath } from './WebdavPath';

export abstract class WebdavItem {
  abstract readonly path: WebdavPath;

  abstract readonly createdAt: Date;

  abstract readonly updatedAt: Date;

  abstract readonly size: number;

  abstract rename(path: WebdavPath): WebdavItem;
  abstract moveTo(folder: WebdavFolder): WebdavItem;

  abstract isFolder(): this is WebdavFolder;
  abstract isFile(): this is WebdavFile;
  abstract hasParent(id: number): boolean;
  abstract toProps(): Record<string, string | number>;
}
