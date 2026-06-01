import { Readable } from 'stream';
import { StorageFileId } from './StorageFileId';
import { StorageFile } from './StorageFile';
import { Result } from '../../../shared/domain/Result';

export abstract class StorageFilesRepository {
  abstract exists(id: StorageFileId): Promise<boolean>;

  abstract retrieve(id: StorageFileId): Promise<StorageFile>;

  abstract store(file: StorageFile, readable: Readable, onProgress: (bytesWritten: number) => void): Promise<void>;

  abstract register(file: StorageFile): Promise<void>;

  abstract read(id: StorageFileId): Promise<Buffer>;

  abstract delete(id: StorageFileId): Promise<void>;

  abstract deleteAll(): Promise<Result<void, Error>>;

  abstract all(): Promise<Array<StorageFile>>;
}
