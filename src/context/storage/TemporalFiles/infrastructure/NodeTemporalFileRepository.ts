import { Service } from 'diod';
import Logger from 'electron-log';
import fs, { createReadStream, watch } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import * as uuid from 'uuid';
import { TemporalFile } from '../domain/TemporalFile';
import { TemporalFilePath } from '../domain/TemporalFilePath';
import { TemporalFileRepository } from '../domain/TemporalFileRepository';
import { Optional } from '../../../../shared/types/Optional';
import { exec } from 'child_process';
import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';

@Service()
export class NodeTemporalFileRepository implements TemporalFileRepository {
  private readonly map = new Map<string, string>();

  constructor(private readonly folder: string) {}

  init() {
    ensureFolderExists(this.folder);
  }

  async exits(documentPath: TemporalFilePath): Promise<boolean> {
    const pathToRead = this.map.get(documentPath.value);

    if (!pathToRead) {
      return false;
    }

    return new Promise((resolve) => {
      fs.stat(pathToRead, (err) => {
        if (err) {
          resolve(false);
          return;
        }

        resolve(true);
      });
    });
  }

  create(documentPath: TemporalFilePath): Promise<void> {
    const id = uuid.v4();

    const pathToWrite = path.join(this.folder, id);

    this.map.set(documentPath.value, pathToWrite);

    return new Promise((resolve, reject) => {
      fs.writeFile(pathToWrite, '', (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  areEqual(doc1: TemporalFilePath, doc2: TemporalFilePath): Promise<boolean> {
    const file1 = this.map.get(doc1.value);
    const file2 = this.map.get(doc2.value);

    if (!file1) {
      throw new Error(`${doc1.value} not found`);
    }
    if (!file2) {
      throw new Error(`${doc2.value} not found`);
    }

    return new Promise((resolve, reject) => {
      exec(`diff ${file1} ${file2}`, (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        const filesAreEqual = stdout === null;
        resolve(filesAreEqual);
      });
    });
  }

  async delete(documentPath: TemporalFilePath): Promise<void> {
    const pathToDelete = this.map.get(documentPath.value);

    if (!pathToDelete) {
      return;
    }

    const fsDeletion = new Promise<void>((resolve, reject) => {
      fs.unlink(pathToDelete, (err: NodeJS.ErrnoException | null) => {
        if (err) {
          if (err.code !== 'ENOENT') {
            Logger.debug(
              `Could not delete ${pathToDelete}, it already does not exists`
            );
            resolve();
            return;
          }

          reject(err);
          return;
        }

        resolve();
      });
    });

    await fsDeletion;

    this.map.delete(documentPath.value);
  }

  async matchingDirectory(directory: string): Promise<TemporalFilePath[]> {
    const paths = Array.from(this.map.keys());

    return paths
      .filter((p) => path.dirname(p) === directory)
      .map((p) => new TemporalFilePath(p));
  }

  read(documentPath: TemporalFilePath): Promise<Buffer> {
    const id = this.map.get(documentPath.value);

    if (!id) {
      throw new Error(`Document with path ${documentPath.value} not found`);
    }

    return readFile(id);
  }

  async write(
    documentPath: TemporalFilePath,
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<void> {
    const pathToWrite = this.map.get(documentPath.value);

    if (!pathToWrite) {
      throw new Error(`Document with path ${documentPath.value} not found`);
    }

    const fd = fs.openSync(pathToWrite, 'r+');

    try {
      fs.writeSync(fd, buffer, 0, length, position);
    } finally {
      fs.closeSync(fd);
    }
  }

  async stream(documentPath: TemporalFilePath): Promise<Readable> {
    const pathToRead = this.map.get(documentPath.value);

    if (!pathToRead) {
      throw new Error(`Document with path ${documentPath.value} not found`);
    }

    return createReadStream(pathToRead);
  }

  async find(documentPath: TemporalFilePath): Promise<Optional<TemporalFile>> {
    const pathToSearch = this.map.get(documentPath.value);

    if (!pathToSearch) {
      return Optional.empty();
    }

    const stat = fs.statSync(pathToSearch);

    const doc = TemporalFile.from({
      createdAt: stat.ctime,
      modifiedAt: stat.mtime,
      path: documentPath.value,
      size: stat.size,
    });

    return Optional.of(doc);
  }

  watchFile(documentPath: TemporalFilePath, callback: () => void): () => void {
    const pathToWatch = this.map.get(documentPath.value);

    if (!pathToWatch) {
      throw new Error(`Document with path ${documentPath.value} not found`);
    }

    const watcher = watch(pathToWatch, (_, filename) => {
      if (filename !== documentPath.nameWithExtension()) {
        return;
      }

      Logger.warn(filename, ' has been changed');

      callback();
    });

    return () => {
      watcher.close();
    };
  }
}
