import { Either } from '../../../../shared/domain/Either';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
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

/** @deprecated Use DriveDesktopError instead */
export type RemoteFileSystemErrors = 'ALREADY_EXISTS' | 'WRONG_DATA' | 'UNHANDLED';

export abstract class RemoteFileSystem {
  abstract persist(plainName: string, parentFolderUuid: string): Promise<Either<DriveDesktopError, FolderPersistedDto>>;

  abstract searchWith(parentId: FolderId, folderPath: FolderPath): Promise<Folder | undefined>;
}
