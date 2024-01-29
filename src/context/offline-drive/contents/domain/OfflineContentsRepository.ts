import { Readable } from 'stream';
import { OfflineFile } from '../../files/domain/OfflineFile';

export interface OfflineContentsRepository {
  writeToFile(id: OfflineFile['id'], buffer: Buffer): Promise<void>;

  createEmptyFile(id: OfflineFile['id']): Promise<void>;

  getAbsolutePath(id: OfflineFile['id']): Promise<string>;

  provide: (path: string) => Promise<{
    contents: Readable;
    size: number;
    abortSignal: AbortSignal;
  }>;
}
