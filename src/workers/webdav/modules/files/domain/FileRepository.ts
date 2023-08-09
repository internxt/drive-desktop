import { File } from './File';
import { Nullable } from '../../../../../shared/types/Nullable';
import { FilePath } from './FilePath';

export interface FileRepository {
  search(pathLike: FilePath): Nullable<File>;

  delete(file: File): Promise<void>;

  add(file: File): Promise<void>;

  updateName(item: File): Promise<void>;

  updateParentDir(item: File): Promise<void>;

  searchOnFolder(folderId: File['folderId']): Promise<Array<File>>;
}
