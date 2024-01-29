import { Readable } from 'stream';
import { OfflineFileAttributes } from '../../files/domain/OfflineFile';

export interface OfflineContentsRepository {
  writeToFile(id: OfflineFileAttributes['id'], buffer: Buffer): Promise<void>;

  createEmptyFile(id: OfflineFileAttributes['id']): Promise<void>;

  getAbsolutePath(id: OfflineFileAttributes['id']): Promise<string>;

  provide: (path: string) => Promise<{
    contents: Readable;
    size: number;
    abortSignal: AbortSignal;
  }>;
}
