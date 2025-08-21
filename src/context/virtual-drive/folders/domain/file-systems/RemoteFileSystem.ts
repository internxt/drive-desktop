import { Either } from '../../../../shared/domain/Either';
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

export type RemoteFileSystemErrors =
  | 'ALREADY_EXISTS'
  | 'WRONG_DATA'
  | 'UNHANDLED';

export abstract class RemoteFileSystem {
  abstract persist(
    plainName: string,
    parentFolderUuid: string
  ): Promise<Either<RemoteFileSystemErrors, FolderPersistedDto>>;

  abstract trash(id: Folder['id']): Promise<void>;

  abstract move(
    folderUuid: string,
    destinationFolderUuid: string
  ): Promise<void>;

  abstract rename(folder: Folder): Promise<void>;

  abstract searchWith(
    parentId: FolderId,
    folderPath: FolderPath
  ): Promise<Folder | undefined>;
}
