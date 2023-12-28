import fs from 'fs';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import { OfflineFileAttributes } from '../../files/domain/OfflineFile';
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

  private async filePath(id: string): Promise<string> {
    const folder = await this.folderPath();

    return path.join(folder, id);
  }

  async init(): Promise<void> {
    const folder = await this.folderPath();

    fs.mkdirSync(folder, { recursive: true });
  }

  async writeToFile(
    id: OfflineFileAttributes['id'],
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<void> {
    const file = await this.filePath(id);

    return new Promise((resolve) => {
      fs.open(file, 'w', (err, fileDescriptor) => {
        if (err) {
          throw err;
        }

        const dataBuffer = Buffer.from(buffer.slice(0, length));

        fs.write(
          fileDescriptor,
          dataBuffer,
          0,
          length,
          position,
          (writeErr) => {
            if (writeErr) {
              throw writeErr;
            }

            fs.close(fileDescriptor, () => {
              if (writeErr) {
                throw writeErr; // TODO: is this needed?
              }

              resolve();
            });
          }
        );
      });
    });
  }

  async createEmptyFile(id: string): Promise<void> {
    const file = await this.filePath(id);

    Logger.debug('Creating an empty file on ', file);

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

  async getAbsolutePath(id: string): Promise<string> {
    return this.filePath(id);
  }

  provide: (
    path: string
  ) => Promise<{ contents: Readable; size: number; abortSignal: AbortSignal }>;
}
