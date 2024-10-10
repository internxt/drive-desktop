import { Either } from '../../../../shared/domain/Either';
import { File } from '../../../files/domain/File';
import { FileStatuses } from '../../../files/domain/FileStatus';
import { Folder, FolderAttributes } from '../Folder';
import { FolderId } from '../FolderId';
import { FolderPath } from '../FolderPath';
import { FolderStatuses } from '../FolderStatus';
import { FolderUuid } from '../FolderUuid';
import { OfflineFolder } from '../OfflineFolder';

export type FolderPersistedDto = {
  id: number;
  uuid: string;
  parentId: number;
  updatedAt: string;
  createdAt: string;
};

export type RemoteFileSystemErrors =
  | 'ALREADY_EXISTS'
  | 'WRONG_DATA'
  | 'UNHANDLED';

export abstract class RemoteFolderSystem {
  abstract persistv2(
    path: FolderPath,
    parentId: FolderId,
    uuid?: FolderUuid
  ): Promise<Either<RemoteFileSystemErrors, FolderPersistedDto>>;

  abstract persist(offline: OfflineFolder): Promise<FolderAttributes>;

  abstract trash(id: Folder['id']): Promise<void>;

  abstract move(folder: Folder): Promise<void>;

  abstract rename(folder: Folder): Promise<void>;

  abstract checkStatusFile(uuid: File['uuid']): Promise<FileStatuses>;

  abstract checkStatusFolder(uuid: Folder['uuid']): Promise<FolderStatuses>;

  abstract searchWith(
    parentId: FolderId,
    folderPath: FolderPath
  ): Promise<Folder | undefined>;
}
