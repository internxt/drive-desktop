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

@Service()
export class NodeTemporalFileRepository implements TemporalFileRepository {
  private readonly writableFilesMap = new Map<string, string>();

  constructor(
    private readonly readBaseFolder: string,
    private readonly writeBaseFolder: string
  ) {}

  create(documentPath: TemporalFilePath): Promise<void> {
    const id = uuid.v4();

    const pathToWrite = path.join(this.writeBaseFolder, id);

    this.writableFilesMap.set(documentPath.value, pathToWrite);

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
    const file1 = this.writableFilesMap.get(doc1.value);
    const file2 = this.writableFilesMap.get(doc2.value);

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
    const pathToDelete = this.writableFilesMap.get(documentPath.value);

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

    this.writableFilesMap.delete(documentPath.value);
  }

  async matchingDirectory(directory: string): Promise<TemporalFilePath[]> {
    const paths = Array.from(this.writableFilesMap.keys());

    return paths
      .filter((p) => path.dirname(p) === directory)
      .map((p) => new TemporalFilePath(p));
  }

  read(documentPath: TemporalFilePath): Promise<Buffer> {
    const id = this.writableFilesMap.get(documentPath.value);

    if (!id) {
      throw new Error(`Document with path ${documentPath.value} not found`);
    }

    const pathToRead = path.join(this.readBaseFolder, id);

    return readFile(pathToRead);
  }

  async write(
    documentPath: TemporalFilePath,
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<void> {
    const pathToWrite = this.writableFilesMap.get(documentPath.value);

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
    const pathToRead = this.writableFilesMap.get(documentPath.value);

    if (!pathToRead) {
      throw new Error(`Document with path ${documentPath.value} not found`);
    }

    return createReadStream(pathToRead);
  }

  async find(documentPath: TemporalFilePath): Promise<Optional<TemporalFile>> {
    const pathToSearch = this.writableFilesMap.get(documentPath.value);

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
    const pathToWatch = this.writableFilesMap.get(documentPath.value);

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
