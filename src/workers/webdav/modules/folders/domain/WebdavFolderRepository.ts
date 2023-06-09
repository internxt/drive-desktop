import { WebdavFolder, WebdavFolderAttributes } from './WebdavFolder';
import { Nullable } from '../../../../../shared/types/Nullable';
import { FolderPath } from './FolderPath';

export interface WebdavFolderRepository {
  search(path: string): Nullable<WebdavFolder>;

  create(
    name: FolderPath,
    parentId: WebdavFolderAttributes['parentId']
  ): Promise<WebdavFolder>;

  updateName(folder: WebdavFolder): Promise<void>;

  updateParentDir(folder: WebdavFolder): Promise<void>;

  searchOn(folder: WebdavFolder): Promise<Array<WebdavFolder>>;

  trash(folder: WebdavFolder): Promise<void>;
}
