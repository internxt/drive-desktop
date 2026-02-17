import { Either } from '../../../../shared/domain/Either';
import { Folder } from '../Folder';
import { FolderId } from '../FolderId';
import { FolderPath } from '../FolderPath';

export type FolderPersistedDto = {
  id: number;
  uuid: string;
  parentId: number;
  updatedAt: string;
  createdAt: string;
};

export type RemoteFileSystemErrors = 'ALREADY_EXISTS' | 'WRONG_DATA' | 'UNHANDLED';

export abstract class RemoteFileSystem {
  abstract persist(
    plainName: string,
    parentFolderUuid: string,
  ): Promise<Either<RemoteFileSystemErrors, FolderPersistedDto>>;

  abstract searchWith(parentId: FolderId, folderPath: FolderPath): Promise<Folder | undefined>;
}
