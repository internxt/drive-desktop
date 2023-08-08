import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { Path } from './Path';

export abstract class WebdavItem {
  abstract readonly path: Path;

  abstract readonly createdAt: Date;

  abstract readonly updatedAt: Date;

  abstract readonly size: number;

  abstract rename(path: Path): WebdavItem;
  abstract moveTo(folder: Folder): WebdavItem;

  abstract isFolder(): this is Folder;
  abstract isFile(): this is File;
  abstract hasParent(id: number): boolean;
  abstract toProps(): Record<string, string | number>;
}
