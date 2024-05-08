import { Readable } from 'stream';
import { StorageFileId } from './StorageFileId';

export abstract class StorageFileCache {
  abstract has(id: StorageFileId): Promise<boolean>;
  abstract store(id: StorageFileId, value: Buffer): Promise<void>;
  abstract pipe(id: StorageFileId, stream: Readable): Promise<void>;
  abstract read(id: StorageFileId): Promise<Buffer>;
  abstract delete(id: StorageFileId): Promise<void>;
  abstract clear(): Promise<void>;
}
