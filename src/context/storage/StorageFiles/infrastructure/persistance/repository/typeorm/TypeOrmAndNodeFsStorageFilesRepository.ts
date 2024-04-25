import { Service } from 'diod';
import { Readable } from 'form-data';
import { PathLike } from 'fs';
import { readFile, unlink } from 'fs/promises';
import path from 'path';
import {
  DataSource,
  Repository,
} from '../../../../../../../apps/node_modules/typeorm';
import { ensureFolderExists } from '../../../../../../../apps/shared/fs/ensure-folder-exists';
import { WriteReadableToFile } from '../../../../../../../apps/shared/fs/write-readable-to-file';
import { StorageFile } from '../../../../domain/StorageFile';
import { StorageFileId } from '../../../../domain/StorageFileId';
import { StorageFileRepository } from '../../../../domain/StorageFileRepository';
import { TypeOrmStorageFile } from './entities/TypeOrmStorageFile';

@Service()
export class TypeOrmAndNodeFsStorageFilesRepository
  implements StorageFileRepository
{
  private readonly db: Repository<TypeOrmStorageFile>;

  constructor(private readonly baseFolder: string, dataSource: DataSource) {
    this.db = dataSource.getRepository('storage_file');
  }

  private calculateFsPath(file: StorageFile): PathLike {
    return path.join(this.baseFolder, file.id.value);
  }

  private save(file: StorageFile): void {
    this.db.save(file.attributes());
  }

  async init(): Promise<void> {
    ensureFolderExists(this.baseFolder);
  }

  async store(file: StorageFile, readable: Readable): Promise<void> {
    await WriteReadableToFile.write(readable, this.calculateFsPath(file));

    this.save(file);
  }

  async read(id: StorageFileId): Promise<Buffer> {
    const pathToRead = path.join(this.baseFolder, id.value);

    const buffer = await readFile(pathToRead);

    return buffer;
  }

  async exists(id: StorageFileId): Promise<boolean> {
    const attributes = await this.db.findOneBy({
      id: id.value,
    });

    if (!attributes) {
      return false;
    }

    return true;
  }

  async retrieve(id: StorageFileId): Promise<StorageFile> {
    const attributes = await this.db.findOneBy({
      id: id.value,
    });

    if (!attributes) {
      throw new Error(`Storage file ${id.value} not found`);
    }

    return StorageFile.from(attributes);
  }

  async delete(id: StorageFileId): Promise<void> {
    const pathToUnlink = path.join(this.baseFolder, id.value);

    await unlink(pathToUnlink);

    await this.db.delete(id.value);
  }

  async deleteAll(): Promise<void> {
    const all = await this.db.find();

    const deleted = all
      .map((att: { id: string }) => new StorageFileId(att.id))
      .map((id: StorageFileId) => this.delete(id));

    await Promise.all(deleted);
  }
}
