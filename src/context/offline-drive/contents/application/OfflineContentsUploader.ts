import { UploadProgressTracker } from '../../../shared/domain/UploadProgressTracker';
import {
  OfflineContentUploader,
  OfflineContentsManagersFactory,
} from '../domain/OfflineContentsManagersFactory';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import Logger from 'electron-log';

export class OfflineContentsUploader {
  constructor(
    private readonly contentsManagersFactory: OfflineContentsManagersFactory,
    private readonly repository: OfflineContentsRepository,
    private readonly progressTracker: UploadProgressTracker
  ) {}

  private registerEvents(
    name: string,
    extension: string,
    size: number,
    uploader: OfflineContentUploader
  ) {
    uploader.on('start', () => {
      this.progressTracker.uploadStarted(name, extension, size, {
        elapsedTime: uploader.elapsedTime(),
      });
      Logger.debug('FILE_UPLOADING', {
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });

    uploader.on('progress', (progress: number) => {
      this.progressTracker.uploadProgress(name, extension, size, {
        elapsedTime: uploader.elapsedTime(),
        progress,
      });
      Logger.debug('FILE_UPLOADING', {
        processInfo: { elapsedTime: uploader.elapsedTime(), progress },
      });
    });

    uploader.on('error', (error: Error) => {
      this.progressTracker.uploadError(name, extension, error.message);
      Logger.debug('FILE_UPLOAD_ERROR', {
        error: error.message,
      });
    });

    uploader.on('finish', () => {
      this.progressTracker.uploadCompleted(name, extension, size, {
        elapsedTime: uploader.elapsedTime(),
      });
      Logger.debug('FILE_UPLOADED', {
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });
  }

  async run(
    name: string,
    extension: string,
    absolutePath: string
  ): Promise<string> {
    const {
      contents: readable,
      abortSignal,
      size,
    } = await this.repository.provide(absolutePath);

    const uploader = this.contentsManagersFactory.uploader(size, abortSignal);

    this.registerEvents(name, extension, size, uploader);

    const contentsId = await uploader.upload(readable, size);

    Logger.debug('FILE UPLOADED WITH ID: ', contentsId);

    return contentsId;
  }
}
