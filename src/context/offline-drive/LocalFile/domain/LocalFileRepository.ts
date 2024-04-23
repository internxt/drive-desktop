import { Readable } from 'stream';
import { LocalFileId } from './LocalFileId';

export abstract class LocalFileRepository {
  abstract exists(id: LocalFileId): Promise<boolean>;

  abstract store(id: LocalFileId, readable: Readable): Promise<void>;

  abstract read(id: LocalFileId): Promise<Buffer>;

  abstract delete(id: LocalFileId): Promise<void>;

  abstract deleteAll(): Promise<void>;
}
