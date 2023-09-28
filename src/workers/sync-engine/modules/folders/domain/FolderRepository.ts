import { Folder, FolderAttributes } from './Folder';
import { Nullable } from '../../../../../shared/types/Nullable';
import { FolderPath } from './FolderPath';

export interface FolderRepository {
  search(path: string): Nullable<Folder>;

  searchByPartial(partial: Partial<FolderAttributes>): Nullable<Folder>;

  create(
    name: FolderPath,
    parentId: FolderAttributes['parentId']
  ): Promise<Folder>;

  updateName(folder: Folder): Promise<void>;

  updateParentDir(folder: Folder): Promise<void>;

  searchOn(folder: Folder): Promise<Array<Folder>>;

  trash(folder: Folder): Promise<void>;
}
