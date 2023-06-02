import { WebdavFile } from './WebdavFile';
import { Nullable } from '../../../../../shared/types/Nullable';
import { WebdavFolderAttributes } from '../../folders/domain/WebdavFolder';

export interface WebdavFileRepository {
  search(pathLike: string): Nullable<WebdavFile>;

  delete(file: WebdavFile): Promise<void>;

  add(file: WebdavFile): Promise<void>;

  updateName(item: WebdavFile): Promise<void>;

  updateParentDir(item: WebdavFile): Promise<void>;

  searchOnFolder(folderId: WebdavFolderAttributes['id']): Array<WebdavFile>;
}
