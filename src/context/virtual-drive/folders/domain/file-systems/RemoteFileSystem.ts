import { Folder, FolderAttributes } from '../Folder';
import { OfflineFolder } from '../OfflineFolder';

export interface RemoteFileSystem {
  persist(offline: OfflineFolder): Promise<FolderAttributes>;

  trash(id: Folder['id']): Promise<void>;

  move(folder: Folder): Promise<void>;

  rename(folder: Folder): Promise<void>;
}
