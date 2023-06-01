import { Nullable } from '../../../../../shared/types/Nullable';
import { WebdavFile } from '../../files/domain/WebdavFile';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavPath } from '../../shared/domain/WebdavPath';

/** @deprecated */
export interface ItemRepository {
  listContents(folderPath: string): Array<WebdavPath>;

  searchItem(pathLike: string): Nullable<WebdavFile | WebdavFolder>;

  searchParentFolder(itemPath: string): Nullable<WebdavFolder>;

  createFolder(folderPath: string, parentFolder: WebdavFolder): Promise<void>;

  deleteFolder(item: WebdavFolder): Promise<void>;

  deleteFile(file: WebdavFile): Promise<void>;

  addFile(file: WebdavFile): Promise<void>;

  updateName(item: WebdavFile | WebdavFolder): Promise<void>;

  updateParentDir(item: WebdavFile | WebdavFolder): Promise<void>;
}
