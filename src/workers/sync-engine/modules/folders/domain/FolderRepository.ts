import { Folder, FolderAttributes } from './Folder';
import { Nullable } from '../../../../../shared/types/Nullable';

export interface FolderRepository {
  all(): Promise<Array<Folder>>;

  searchByPartial(
    partial: Partial<FolderAttributes>
  ): Promise<Nullable<Folder>>;

  add(folder: Folder): Promise<void>;

  update(folder: Folder): Promise<void>;

  delete(folder: Folder): Promise<void>;
}
