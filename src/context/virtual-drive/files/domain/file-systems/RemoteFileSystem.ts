import { Either } from '../../../../shared/domain/Either';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { File, FileAttributes } from '../File';
import { FileContentsId } from '../FileContentsId';
import { FileFolderId } from '../FileFolderId';
import { FilePath } from '../FilePath';
import { FileSize } from '../FileSize';
import { FileStatuses } from '../FileStatus';
import { OfflineFile } from '../OfflineFile';

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
  abstract persist(offline: OfflineFile): Promise<FileAttributes>;

  abstract persistv2(
    offline: FileDataToPersist
  ): Promise<Either<DriveDesktopError, PersistedFileData>>;

  abstract trash(contentsId: File['contentsId']): Promise<void>;

  abstract move(file: File): Promise<void>;

  abstract rename(file: File): Promise<void>;

  abstract checkStatusFile(
    contentsId: File['contentsId']
  ): Promise<FileStatuses>;

  abstract override(file: File): Promise<void>;

  abstract delete(file: File): Promise<void>;

  abstract replace(
    file: File,
    newContentsId: File['contentsId'],
    newSize: File['size']
  ): Promise<void>;
}
