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

export abstract class RemoteFileSystem {
  abstract persist(
    path: FolderPath,
    parentId: FolderId,
    uuid?: FolderUuid
  ): Promise<FolderPersistedDto>;

  abstract trash(id: Folder['id']): Promise<void>;

  abstract move(folder: Folder): Promise<void>;

  abstract rename(folder: Folder): Promise<void>;
}
