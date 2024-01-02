import {
  OfflineContentUploader,
  OfflineContentsManagersFactory,
} from '../domain/OfflineContentsManagersFactory';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import Logger from 'electron-log';

export class OfflineContentsUploader {
  constructor(
    private readonly contentsManagersFactory: OfflineContentsManagersFactory,
    private readonly repository: OfflineContentsRepository
  ) {}

  private registerEvents(uploader: OfflineContentUploader) {
    uploader.on('start', () => {
      Logger.debug('FILE_UPLOADING', {
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });

    uploader.on('progress', (progress: number) => {
      Logger.debug('FILE_UPLOADING', {
        processInfo: { elapsedTime: uploader.elapsedTime(), progress },
      });
    });

    uploader.on('error', (error: Error) => {
      Logger.debug('FILE_UPLOAD_ERROR', {
        error: error.message,
      });
    });

    uploader.on('finish', () => {
      Logger.debug('FILE_UPLOADED', {
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });
  }

  async run(absolutePath: string): Promise<string> {
    const { contents, abortSignal, size } = await this.repository.provide(
      absolutePath
    );

    const uploader = this.contentsManagersFactory.uploader(size, abortSignal);

    this.registerEvents(uploader);

    const contentsId = await uploader.upload(contents, size);

    Logger.debug('FILE UPLOADED WITH ID: ', contentsId);

    return contentsId;
  }
}
