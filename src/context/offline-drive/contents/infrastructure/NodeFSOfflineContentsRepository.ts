import fs, { createReadStream, watch } from 'fs';
import { stat as statPromises } from 'fs/promises';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import { OfflineFile } from '../../files/domain/OfflineFile';
import { LocalFileContentsDirectoryProvider } from '../../../virtual-drive/shared/domain/LocalFileContentsDirectoryProvider';
import path from 'path';
import Logger from 'electron-log';
import { Readable } from 'stream';

export class NodeFSOfflineContentsRepository
  implements OfflineContentsRepository
{
  constructor(
    private readonly locationProvider: LocalFileContentsDirectoryProvider,
    private readonly subfolder: string
  ) {}

  private async folderPath(): Promise<string> {
    const location = await this.locationProvider.provide();

    return path.join(location, this.subfolder);
  }

  private async filePath(id: OfflineFile['id']): Promise<string> {
    const folder = await this.folderPath();

    return path.join(folder, id.value);
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

  async writeToFile(id: OfflineFile['id'], buffer: Buffer): Promise<void> {
    const file = await this.filePath(id);

    fs.appendFileSync(file, buffer);
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

  async provide(absoluteFilePath: string) {
    const { readable, controller } =
      this.createAbortableStream(absoluteFilePath);

    const { size } = await statPromises(absoluteFilePath);

    const absoluteFolderPath = path.dirname(absoluteFilePath);
    const nameWithExtension = path.basename(absoluteFilePath);

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

    return {
      contents: readable,
      size,
      abortSignal: controller.signal,
    };
  }
}
