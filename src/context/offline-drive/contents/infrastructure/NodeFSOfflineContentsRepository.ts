import fs, { createReadStream, unlink, watch } from 'fs';
import { readFile, stat as statPromises } from 'fs/promises';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import { OfflineFile } from '../../files/domain/OfflineFile';
import { LocalFileContentsDirectoryProvider } from '../../../virtual-drive/shared/domain/LocalFileContentsDirectoryProvider';
import { basename, dirname, join } from 'path';
import Logger from 'electron-log';
import { Readable } from 'stream';
import { OfflineContents } from '../domain/OfflineContents';
import { OfflineContentsName } from '../domain/OfflineContentsName';
import { OfflineFileId } from '../../files/domain/OfflineFileId';

export class NodeFSOfflineContentsRepository
  implements OfflineContentsRepository
{
  constructor(
    private readonly locationProvider: LocalFileContentsDirectoryProvider,
    private readonly subfolder: string
  ) {}

  private async folderPath(): Promise<string> {
    const location = await this.locationProvider.provide();

    return join(location, this.subfolder);
  }

  private async filePath(name: OfflineContentsName): Promise<string> {
    const folder = await this.folderPath();

    return join(folder, name.value);
  }

  private createAbortableStream(filePath: string): {
    readable: Readable;
    controller: AbortController;
  } {
    const readStream = createReadStream(filePath);

    const controller = new AbortController();

    return { readable: readStream, controller };
  }

  async init(): Promise<void> {
    const folder = await this.folderPath();

    fs.mkdirSync(folder, { recursive: true });
  }

  async writeToFile(
    id: OfflineFile['id'],
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<void> {
    const file = await this.filePath(id);

    // Open the file in write mode with the 'r+' flag to allow reading and writing.
    const fd = fs.openSync(file, 'r+');

    try {
      // Write the buffer to the file at the specified position.
      fs.writeSync(fd, buffer, 0, length, position);
    } finally {
      // Close the file descriptor to release resources.
      fs.closeSync(fd);
    }
  }

  async createEmptyFile(id: OfflineFile['id']): Promise<void> {
    const file = await this.filePath(id);

    return new Promise((resolve) => {
      fs.writeFile(file, '', (err) => {
        if (err) {
          Logger.error('[FSOfflineFileFileSystem] ', err);
          throw new Error(`could not create empty file for id: ${id}`);
        }

        resolve();
      });
    });
  }

  async getAbsolutePath(id: OfflineFile['id']): Promise<string> {
    return this.filePath(id);
  }

  async createStream(offlineContentsName: OfflineContentsName): Promise<{
    contents: OfflineContents;
    stream: Readable;
    abortSignal: AbortSignal;
  }> {
    const absoluteFilePath = await this.getAbsolutePath(offlineContentsName);

    const { readable, controller } =
      this.createAbortableStream(absoluteFilePath);

    const { size, mtimeMs, birthtimeMs } = await statPromises(absoluteFilePath);

    const absoluteFolderPath = dirname(absoluteFilePath);
    const nameWithExtension = basename(absoluteFilePath);

    const watcher = watch(absoluteFolderPath, (_, filename) => {
      if (filename !== nameWithExtension) {
        return;
      }
      Logger.warn(
        filename,
        ' has been changed during read, it will be aborted'
      );

      controller.abort();
    });

    readable.on('end', () => {
      watcher.close();
    });

    const contents = OfflineContents.from({
      name: offlineContentsName.value,
      size,
      modifiedTime: mtimeMs,
      birthTime: birthtimeMs,
      absolutePath: absoluteFilePath,
    });

    return {
      contents,
      stream: readable,
      abortSignal: controller.signal,
    };
  }

  private buffers: Map<string, Buffer> = new Map();

  async read(path: string): Promise<Buffer> {
    const cached = this.buffers.get(path);

    if (cached) {
      return cached;
    }

    const read = await readFile(path);
    this.buffers.set(path, read);

    return read;
  }

  async forget(path: string): Promise<void> {
    const deleted = this.buffers.delete(path);

    if (deleted) {
      Logger.debug(`Buffer from ${basename(path)} deleted from cache`);
    }
  }

  async readFromId(id: OfflineFileId): Promise<Buffer> {
    const path = await this.getAbsolutePath(id);

    const cached = this.buffers.get(path);

    if (cached) {
      return cached;
    }

    const read = await readFile(path);
    this.buffers.set(path, read);

    return read;
  }

  async remove(id: OfflineFileId): Promise<void> {
    const path = await this.getAbsolutePath(id);

    return new Promise<void>((resolve, reject) => {
      unlink(path, (err: NodeJS.ErrnoException | null) => {
        if (err) {
          if (err.code !== 'ENOENT') {
            Logger.debug(`Could not delete ${id}, it already does not exists`);
            resolve();
            return;
          }

          reject(err);
          return;
        }

        resolve();
      });
    });
  }
}
