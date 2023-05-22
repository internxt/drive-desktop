import { Environment } from '@internxt/inxt-js';
import Logger from 'electron-log';
import { Readable } from 'stream';
import { XFile } from '../domain/File';
import { FileClonner } from './FileClonner';

export class FileOverrider {
  constructor(
    private readonly bucket: string,
    private readonly environment: Environment,
    private readonly clonner: FileClonner
  ) {}

  private delete(file: XFile): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.environment.deleteFile(
        this.bucket,
        file.fileId,
        (err: Error | null, result: unknown) => {
          if (err) {
            Logger.error('Error deleting file');
            reject(err);
          }

          resolve();
        }
      );
    });
  }

  async run(file: XFile) {
    const createdId = await this.clonner.clone(file.fileId);

    await this.delete(file);

    return createdId;
  }
}
