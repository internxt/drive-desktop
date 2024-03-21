import { File, FileAttributes } from '../File';
import { OfflineFile } from '../OfflineFile';

export interface RemoteFileSystem {
  persist(offline: OfflineFile): Promise<FileAttributes>;

  trash(contentsId: File['contentsId']): Promise<void>;

  move(file: File): Promise<void>;

  rename(file: File): Promise<void>;

  override(file: File): Promise<void>;
}
