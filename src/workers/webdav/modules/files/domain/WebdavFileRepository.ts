import { WebdavFile } from './WebdavFile';
import { Nullable } from '../../../../../shared/types/Nullable';
import { FolderAttributes } from '../../folders/domain/Folder';
import { FilePath } from './FilePath';

export interface WebdavFileRepository {
  search(pathLike: FilePath): Nullable<WebdavFile>;

  delete(file: WebdavFile): Promise<void>;

  add(file: WebdavFile): Promise<void>;

  updateName(item: WebdavFile): Promise<void>;

  updateParentDir(item: WebdavFile): Promise<void>;

  searchOnFolder(folderId: FolderAttributes['id']): Promise<Array<WebdavFile>>;
}
