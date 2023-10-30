import { Folder, FolderAttributes } from './Folder';
import { OfflineFolder } from './OfflineFolder';

export interface FolderInternxtFileSystem {
  trash(folder: Folder): Promise<void>;
  create(folder: OfflineFolder): Promise<FolderAttributes>;
  rename(folder: Folder): Promise<void>;
  move(folder: Folder): Promise<void>;
}
