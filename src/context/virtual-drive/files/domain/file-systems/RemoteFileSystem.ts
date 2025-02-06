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
