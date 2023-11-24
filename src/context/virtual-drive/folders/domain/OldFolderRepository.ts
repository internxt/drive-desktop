import { Folder, FolderAttributes } from './Folder';
import { FolderPath } from './FolderPath';

export interface OldFolderRepository {
  all(): Promise<Array<Folder>>;

  search(path: string): Folder | undefined;

  searchByPartial(partial: Partial<FolderAttributes>): Folder | undefined;

  create(
    name: FolderPath,
    parentId: FolderAttributes['parentId'],
    uuid: Folder['uuid']
  ): Promise<Folder>;

  updateName(folder: Folder): Promise<void>;

  updateParentDir(folder: Folder): Promise<void>;

  searchOn(folder: Folder): Promise<Array<Folder>>;

  trash(folder: Folder): Promise<void>;

  /** @deprecated */
  clear(): void;
}
