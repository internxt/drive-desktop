import { Readable } from 'stream';
import { StorageFileId } from './StorageFileId';
import { StorageFilePath } from './StorageFilePath';
import { StorageFile } from './StorageFile';

export abstract class StorageFileRepository {
  abstract exists(path: StorageFilePath): Promise<boolean>;

  abstract retrieve(path: StorageFilePath): Promise<StorageFile>;

  abstract store(file: StorageFile, readable: Readable): Promise<void>;

  abstract read(id: StorageFileId): Promise<Buffer>;

  abstract delete(id: StorageFileId): Promise<void>;

  abstract deleteAll(): Promise<void>;
}
