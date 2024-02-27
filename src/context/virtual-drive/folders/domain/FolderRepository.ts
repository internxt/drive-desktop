import { Folder, FolderAttributes } from './Folder';

export interface FolderRepository {
  all(): Promise<Array<Folder>>;

  searchById(id: Folder['id']): Promise<Folder | undefined>;

  searchByUuid(id: Folder['uuid']): Promise<Folder | undefined>;

  matchingPartial(partial: Partial<FolderAttributes>): Array<Folder>;

  add(folder: Folder): Promise<void>;

  delete(id: Folder['id']): Promise<void>;

  update(folder: Folder): Promise<void>;
}
