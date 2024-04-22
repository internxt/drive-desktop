import { File, FileAttributes } from '../File';
import { OfflineFile } from '../OfflineFile';

export abstract class RemoteFileSystem {
  abstract persist(offline: OfflineFile): Promise<FileAttributes>;

  abstract trash(contentsId: File['contentsId']): Promise<void>;

  abstract move(file: File): Promise<void>;

  abstract rename(file: File): Promise<void>;

  abstract override(file: File): Promise<void>;
}
