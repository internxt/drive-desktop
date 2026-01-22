import { Service } from 'diod';
import { Readable } from 'form-data';
import { readFile, unlink } from 'fs/promises';
import path from 'path';
import { DataSource, Repository } from 'typeorm';
import { ensureFolderExists } from '../../../../../../../apps/shared/fs/ensure-folder-exists';
import { WriteReadableToFile } from '../../../../../../../apps/shared/fs/write-readable-to-file';
import { StorageFile } from '../../../../domain/StorageFile';
import { StorageFileId } from '../../../../domain/StorageFileId';
import { StorageFilesRepository } from '../../../../domain/StorageFilesRepository';
import { TypeOrmStorageFile } from './entities/TypeOrmStorageFile';

@Service()
export class TypeOrmAndNodeFsStorageFilesRepository implements StorageFilesRepository {
  private readonly db: Repository<TypeOrmStorageFile>;

  constructor(
    private readonly baseFolder: string,
    dataSource: DataSource,
  ) {
    this.db = dataSource.getRepository('storage_file');
  }

  async init(): Promise<void> {
    ensureFolderExists(this.baseFolder);
  }

  async store(file: StorageFile, readable: Readable): Promise<void> {
    const where = path.join(this.baseFolder, file.id.value);

    await WriteReadableToFile.write(readable, where);

    await this.db.save(file.attributes());
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

    await this.db.delete({ id: id.value });
  }

  async deleteAll(): Promise<void> {
    const all = await this.db.find();

    const deleted = all
      .map((att: { id: string }) => new StorageFileId(att.id))
      .map((id: StorageFileId) => this.delete(id));

    await Promise.all(deleted);
  }

  async all(): Promise<StorageFile[]> {
    const all = await this.db.find();

    return all.map(StorageFile.from);
  }
}
