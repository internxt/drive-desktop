import { File, FileAttributes } from './File';
import { OfflineFile } from './OfflineFile';

export interface FileInternxtFileSystem {
  trash(file: File): Promise<void>;
  create(offlineFile: OfflineFile): Promise<FileAttributes>;
  rename(file: File): Promise<void>;
  move(file: File): Promise<void>;
}
