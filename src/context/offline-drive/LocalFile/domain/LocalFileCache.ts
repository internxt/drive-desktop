import { LocalFileId } from './LocalFileId';

export abstract class LocalFileCache {
  abstract has(id: LocalFileId): Promise<boolean>;
  abstract store(id: LocalFileId, value: Buffer): Promise<void>;
  abstract read(id: LocalFileId): Promise<Buffer>;
  abstract delete(id: LocalFileId): Promise<void>;
  abstract clear(): Promise<void>;
}
