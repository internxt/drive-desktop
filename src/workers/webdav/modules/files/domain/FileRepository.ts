import { File } from './File';
import { Nullable } from '../../../../../shared/types/Nullable';
import { WebdavFolderAttributes } from '../../folders/domain/WebdavFolder';
import { FilePath } from './FilePath';

export interface FileRepository {
  search(pathLike: FilePath): Nullable<File>;

  delete(file: File): Promise<void>;

  add(file: File): Promise<void>;

  updateName(item: File): Promise<void>;

  updateParentDir(item: File): Promise<void>;

  searchOnFolder(folderId: WebdavFolderAttributes['id']): Promise<Array<File>>;
}
