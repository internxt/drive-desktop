import { File, FileAttributes } from '../File';
import { FileStatuses } from '../FileStatus';
import { OfflineFile } from '../OfflineFile';

export interface RemoteFileSystem {
  persist(offline: OfflineFile): Promise<FileAttributes>;

  trash(contentsId: File['contentsId']): Promise<void>;

  move(file: File): Promise<void>;

  rename(file: File): Promise<void>;

  checkStatusFile(uuid: File['uuid']): Promise<FileStatuses>;

  replace(
    file: File,
    newContentsId: File['contentsId'],
    newSize: File['size']
  ): Promise<void>;
}
