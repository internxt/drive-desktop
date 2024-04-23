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
  abstract persist(offline: FileDataToPersist): Promise<PersistedFileData>;

  abstract trash(contentsId: File['contentsId']): Promise<void>;

  abstract move(file: File): Promise<void>;

  abstract rename(file: File): Promise<void>;

  abstract override(file: File): Promise<void>;
}
