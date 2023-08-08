import { File } from '../../files/domain/File';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { Path } from './Path';

export abstract class WebdavItem {
  abstract readonly path: Path;

  abstract readonly createdAt: Date;

  abstract readonly updatedAt: Date;

  abstract readonly size: number;

  abstract rename(path: Path): WebdavItem;
  abstract moveTo(folder: WebdavFolder): WebdavItem;

  abstract isFolder(): this is WebdavFolder;
  abstract isFile(): this is File;
  abstract hasParent(id: number): boolean;
  abstract toProps(): Record<string, string | number>;
}
