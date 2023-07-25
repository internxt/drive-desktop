import { WebdavFile } from './WebdavFile';
import { Nullable } from '../../../../../shared/types/Nullable';
import { WebdavFolderAttributes } from '../../folders/domain/WebdavFolder';
import { FilePath } from './FilePath';

export interface WebdavFileRepository {
  search(pathLike: FilePath): Nullable<WebdavFile>;

  delete(file: WebdavFile): Promise<void>;

  /** TODO: Change back promise to resolve void
   * once we can create thumbnails with the uuid id */
  add(file: WebdavFile): Promise<number>;

  updateName(item: WebdavFile): Promise<void>;

  updateParentDir(item: WebdavFile): Promise<void>;

  searchOnFolder(
    folderId: WebdavFolderAttributes['id']
  ): Promise<Array<WebdavFile>>;
}
