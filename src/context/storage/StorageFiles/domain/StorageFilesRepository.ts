import { Readable } from 'stream';
import { StorageFileId } from './StorageFileId';
import { StorageFile } from './StorageFile';

export abstract class StorageFilesRepository {
  abstract exists(id: StorageFileId): Promise<boolean>;

  abstract retrieve(id: StorageFileId): Promise<StorageFile>;

  abstract store(file: StorageFile, readable: Readable): Promise<void>;

  abstract read(id: StorageFileId): Promise<Buffer>;

  abstract delete(id: StorageFileId): Promise<void>;

  abstract deleteAll(): Promise<void>;

  abstract all(): Promise<Array<StorageFile>>;
}
