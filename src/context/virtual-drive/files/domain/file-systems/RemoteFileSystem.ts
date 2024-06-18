import { Either } from '../../../../shared/domain/Either';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { File } from '../File';
import { FileContentsId } from '../FileContentsId';
import { FileFolderId } from '../FileFolderId';
import { FilePath } from '../FilePath';
import { FileSize } from '../FileSize';

export type FileDataToPersist = {
  contentsId: FileContentsId;
  path: FilePath;
  size: FileSize;
  folderId: FileFolderId;
};

export type PersistedFileData = {
  modificationTime: string;
  id: number;
  uuid: string;
  createdAt: string;
};

export abstract class RemoteFileSystem {
  abstract persist(
    offline: FileDataToPersist
  ): Promise<Either<DriveDesktopError, PersistedFileData>>;

  abstract trash(contentsId: File['contentsId']): Promise<void>;

  abstract move(file: File): Promise<void>;

  abstract rename(file: File): Promise<void>;

  abstract override(file: File): Promise<void>;

  abstract delete(file: File): Promise<void>;
}
