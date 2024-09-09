import { Folder, FolderAttributes } from '../Folder';
import { FolderStatuses } from '../FolderStatus';
import { OfflineFolder } from '../OfflineFolder';

export interface RemoteFolderSystem {
  persist(offline: OfflineFolder): Promise<FolderAttributes>;

  trash(id: Folder['id']): Promise<void>;

  move(folder: Folder): Promise<void>;

  rename(folder: Folder): Promise<void>;

  checkStatusFolder(uuid: Folder['uuid']): Promise<FolderStatuses>;
}
