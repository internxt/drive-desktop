import { Folder } from '../Folder';
import { FolderId } from '../FolderId';
import { FolderPath } from '../FolderPath';
import { FolderUuid } from '../FolderUuid';

export type FolderPersistedDto = {
  id: number;
  uuid: string;
  parentId: number;
  updatedAt: string;
  createdAt: string;
};

export interface RemoteFileSystem {
  persist(
    path: FolderPath,
    parentId: FolderId,
    uuid?: FolderUuid
  ): Promise<FolderPersistedDto>;

  trash(id: Folder['id']): Promise<void>;

  move(folder: Folder): Promise<void>;

  rename(folder: Folder): Promise<void>;
}
