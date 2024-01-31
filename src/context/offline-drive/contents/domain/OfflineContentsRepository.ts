import { Readable } from 'stream';
import { OfflineFile } from '../../files/domain/OfflineFile';
import { OfflineContents } from './OfflineContents';
import { OfflineContentsName } from './OfflineContentsName';

export interface OfflineContentsRepository {
  writeToFile(id: OfflineFile['id'], buffer: Buffer): Promise<void>;

  createEmptyFile(id: OfflineFile['id']): Promise<void>;

  getAbsolutePath(id: OfflineContentsName): Promise<string>;

  read: (offlineContentsName: OfflineContentsName) => Promise<{
    contents: OfflineContents;
    stream: Readable;
    abortSignal: AbortSignal;
  }>;
}
