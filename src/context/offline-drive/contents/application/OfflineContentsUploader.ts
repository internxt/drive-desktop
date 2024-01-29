import { UploadProgressTracker } from '../../../shared/domain/UploadProgressTracker';
import { EventBus } from '../../../virtual-drive/shared/domain/EventBus';
import {
  OfflineContentUploader,
  OfflineContentsManagersFactory,
} from '../domain/OfflineContentsManagersFactory';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import Logger from 'electron-log';
import { OfflineContentsPathCalculator } from './OfflineContentsPathCalculator';
import { OfflineContentsUploadedDomainEvent } from '../domain/events/OfflineContentsUploadedDomainEvent';
import { FilePath } from '../../../virtual-drive/files/domain/FilePath';
import { OfflineFileId } from '../../files/domain/OfflineFileId';

export class OfflineContentsUploader {
  constructor(
    private readonly offlineContentsPathCalculator: OfflineContentsPathCalculator,
    private readonly contentsManagersFactory: OfflineContentsManagersFactory,
    private readonly repository: OfflineContentsRepository,
    private readonly progressTracker: UploadProgressTracker,
    private readonly eventBus: EventBus
  ) {}

  private registerEvents(
    path: FilePath,
    size: number,
    uploader: OfflineContentUploader
  ) {
    uploader.on('start', () => {
      this.progressTracker.uploadStarted(path.name(), path.extension(), size, {
        elapsedTime: uploader.elapsedTime(),
      });
      Logger.debug('FILE_UPLOADING', {
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });

    uploader.on('progress', (progress: number) => {
      this.progressTracker.uploadProgress(path.name(), path.extension(), size, {
        elapsedTime: uploader.elapsedTime(),
        progress,
      });
      Logger.debug('FILE_UPLOADING', {
        processInfo: { elapsedTime: uploader.elapsedTime(), progress },
      });
    });

    uploader.on('error', (error: Error) => {
      this.progressTracker.uploadError(
        path.name(),
        path.extension(),
        error.message
      );
      Logger.debug('FILE_UPLOAD_ERROR', {
        error: error.message,
      });
    });

    uploader.on('finish', () => {
      this.progressTracker.uploadCompleted(
        path.name(),
        path.extension(),
        size,
        {
          elapsedTime: uploader.elapsedTime(),
        }
      );
      Logger.debug('FILE_UPLOADED', {
        processInfo: { elapsedTime: uploader.elapsedTime() },
      });
    });
  }

  async run(name: OfflineFileId, path: FilePath): Promise<string> {
    const absolutePath = await this.offlineContentsPathCalculator.run(name);

    const {
      contents: readable,
      abortSignal,
      size,
    } = await this.repository.provide(absolutePath);

    const uploader = this.contentsManagersFactory.uploader(size, abortSignal);

    this.registerEvents(path, size, uploader);

    const contentsId = await uploader.upload(readable, size);

    Logger.debug('FILE UPLOADED WITH ID: ', contentsId);

    const contentsUploadedEvent = new OfflineContentsUploadedDomainEvent({
      aggregateId: contentsId,
      offlineContentsPath: absolutePath,
      size,
      path: path.value,
    });

    await this.eventBus.publish([contentsUploadedEvent]);

    return contentsId;
  }
}
