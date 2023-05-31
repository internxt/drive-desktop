import { Environment } from '@internxt/inxt-js';
import Logger from 'electron-log';
import { WebdavFile } from '../../domain/WebdavFile';
import { FileClonner } from './FileClonner';

export class FileOverrider {
  constructor(
    private readonly bucket: string,
    private readonly environment: Environment,
    private readonly clonner: FileClonner
  ) {}

  private delete(file: WebdavFile): Promise<void> {
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

  async run(file: WebdavFile) {
    const createdId = await this.clonner.clone(file.fileId);

    await this.delete(file);

    return createdId;
  }
}
