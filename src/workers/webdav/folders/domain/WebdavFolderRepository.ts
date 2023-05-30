import { WebdavFolder } from './WebdavFolder';
import { Nullable } from '../../../../shared/types/Nullable';

export interface WebdavFolderRepository {
  search(path: string): Nullable<WebdavFolder>;

  delete(file: WebdavFolder): Promise<void>;

  add(file: WebdavFolder): Promise<void>;

  updateName(item: WebdavFolder): Promise<void>;

  updateParentDir(item: WebdavFolder): Promise<void>;
}
