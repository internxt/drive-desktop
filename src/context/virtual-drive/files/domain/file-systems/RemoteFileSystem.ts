import { Either } from '../../../../shared/domain/Either';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { FileContentsId } from '../FileContentsId';
import { FileFolderId } from '../FileFolderId';
import { FilePath } from '../FilePath';
import { FileSize } from '../FileSize';

export type FileDataToPersist = {
  contentsId: FileContentsId;
  path: FilePath;
  size: FileSize;
  folderId: FileFolderId;
  folderUuid: string;
};

export type PersistedFileData = {
  modificationTime: string;
  id: number;
  uuid: string;
  createdAt: string;
};

export abstract class RemoteFileSystem {
  abstract persist(offline: FileDataToPersist): Promise<Either<DriveDesktopError, PersistedFileData>>;
}
