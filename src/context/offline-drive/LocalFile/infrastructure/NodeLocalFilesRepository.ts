import { Service } from 'diod';
import { Readable } from 'form-data';
import { readFile, readdir, unlink } from 'fs/promises';
import path from 'path';
import { WriteReadableToFile } from '../../../../apps/shared/fs/write-readable-to-file';
import { LocalFileId } from '../domain/LocalFileId';
import { LocalFileRepository } from '../domain/LocalFileRepository';

@Service()
export class NodeLocalFilesRepository implements LocalFileRepository {
  private readonly map = new Map<string, string>();
  constructor(private readonly baseFolder: string) {}

  async init(): Promise<void> {
    const files = await readdir(this.baseFolder);

    files.forEach((file) => {
      const id = path.basename(file);

      this.map.set(id, path.join(this.baseFolder, id));
    });
  }

  async store(id: LocalFileId, readable: Readable): Promise<void> {
    const pathToWrite = path.join(this.baseFolder, id.value);

    await WriteReadableToFile.write(readable, pathToWrite);

    this.map.set(id.value, pathToWrite);
  }

  async read(id: LocalFileId): Promise<Buffer> {
    if (!this.map.has(id.value)) {
      throw new Error(`Local file ${id.value} not found`);
    }

    const pathToRead = path.join(this.baseFolder, id.value);

    const buffer = await readFile(pathToRead);

    return buffer;
  }

  async exists(id: LocalFileId): Promise<boolean> {
    return this.map.has(id.value);
  }

  async delete(id: LocalFileId): Promise<void> {
    const pathToUnlink = path.join(this.baseFolder, id.value);

    await unlink(pathToUnlink);

    this.map.delete(id.value);
  }

  async deleteAll(): Promise<void> {
    const iterator = this.map.keys();

    let result = iterator.next();

    while (!result.done) {
      // eslint-disable-next-line no-await-in-loop
      await this.delete(new LocalFileId(result.value));
      result = iterator.next();
    }
  }
}
