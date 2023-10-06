import { Folder } from './Folder';

// TODO: Find a better name
export interface ManagedFolderRepository {
  insert(folder: Folder): Promise<void>;
  overwrite(oldFolder: Folder, newFolder: Folder): Promise<void>;
}
