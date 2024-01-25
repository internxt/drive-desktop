import { Folder, FolderAttributes } from './Folder';

export interface FolderRepository {
  all(): Promise<Array<Folder>>;

  searchByPartial(partial: Partial<FolderAttributes>): Folder | undefined;

  listByPartial(partial: Partial<FolderAttributes>): Promise<Array<Folder>>;

  add(folder: Folder): Promise<void>;

  delete(id: Folder['id']): Promise<void>;

  update(folder: Folder): Promise<void>;
}
