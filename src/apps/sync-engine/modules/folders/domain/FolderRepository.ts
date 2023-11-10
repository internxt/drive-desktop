import { Folder, FolderAttributes } from './Folder';
import { Nullable } from '../../../../../shared/types/Nullable';

export interface FolderRepository {
  all(): Promise<Array<Folder>>;

  searchByPartial(partial: Partial<FolderAttributes>): Nullable<Folder>;

  add(folder: Folder): Promise<void>;

  delete(id: Folder['id']): Promise<void>;

  update(folder: Folder): Promise<void>;
}
