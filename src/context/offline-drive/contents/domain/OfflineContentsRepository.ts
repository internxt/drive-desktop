import { Readable } from 'stream';
import { OfflineFile } from '../../files/domain/OfflineFile';
import { OfflineContents } from './OfflineContents';
import { OfflineContentsName } from './OfflineContentsName';
import { OfflineFileId } from '../../files/domain/OfflineFileId';

export abstract class OfflineContentsRepository {
  abstract writeToFile(
    id: OfflineFile['id'],
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<void>;

  abstract createEmptyFile(id: OfflineFile['id']): Promise<void>;

  abstract getAbsolutePath(id: OfflineContentsName): Promise<string>;

  abstract createStream: (offlineContentsName: OfflineContentsName) => Promise<{
    contents: OfflineContents;
    stream: Readable;
    abortSignal: AbortSignal;
  }>;

  abstract read(path: string): Promise<Buffer>;

  abstract readFromId(id: OfflineFileId): Promise<Buffer>;

  abstract forget(path: string): Promise<void>;

  abstract remove(id: OfflineFileId): Promise<void>;
}
