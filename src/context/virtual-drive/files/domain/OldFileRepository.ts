import { File, FileAttributes } from './File';
import { FolderAttributes } from '../../folders/domain/Folder';
import { FilePath } from './FilePath';

export interface OldFileRepository {
  search(pathLike: FilePath): File | undefined;

  searchByPartial(partial: Partial<FileAttributes>): File | undefined;

  delete(file: File): Promise<void>;

  add(file: File): Promise<void>;

  updateName(item: File): Promise<void>;

  updateParentDir(item: File): Promise<void>;

  searchOnFolder(folderId: FolderAttributes['id']): Promise<Array<File>>;

  all(): Promise<Array<File>>;

  /** @deprecated */
  clear(): void;
}
