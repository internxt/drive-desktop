import { File, FileAttributes } from './File';
import { Nullable } from '../../../../../shared/types/Nullable';
import { FolderAttributes } from '../../folders/domain/Folder';
import { FilePath } from './FilePath';

export interface FileRepository {
  search(pathLike: FilePath): Nullable<File>;

  searchByPartial(partial: Partial<FileAttributes>): Nullable<File>;

  delete(file: File): Promise<void>;

  add(file: File): Promise<void>;

  updateName(item: File): Promise<void>;

  updateParentDir(item: File): Promise<void>;

  searchOnFolder(folderId: FolderAttributes['id']): Promise<Array<File>>;
}
