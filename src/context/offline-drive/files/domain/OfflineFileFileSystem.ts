import { OfflineFileAttributes } from './OfflineFile';

export interface OfflineFileFileSystem {
  writeToFile(
    id: OfflineFileAttributes['id'],
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<void>;

  createEmptyFile(id: OfflineFileAttributes['id']): Promise<void>;
}
