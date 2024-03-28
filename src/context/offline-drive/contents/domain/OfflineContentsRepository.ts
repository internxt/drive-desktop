import { Readable } from 'stream';
import { OfflineFile } from '../../files/domain/OfflineFile';
import { OfflineContents } from './OfflineContents';
import { OfflineContentsName } from './OfflineContentsName';
import { OfflineFileId } from '../../files/domain/OfflineFileId';

export interface OfflineContentsRepository {
  writeToFile(
    id: OfflineFile['id'],
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<void>;

  createEmptyFile(id: OfflineFile['id']): Promise<void>;

  getAbsolutePath(id: OfflineContentsName): Promise<string>;

  createStream: (offlineContentsName: OfflineContentsName) => Promise<{
    contents: OfflineContents;
    stream: Readable;
    abortSignal: AbortSignal;
  }>;

  read(path: string): Promise<Buffer>;

  readFromId(id: OfflineFileId): Promise<Buffer>;

  forget(path: string): Promise<void>;

  remove(id: OfflineFileId): Promise<void>;
}
