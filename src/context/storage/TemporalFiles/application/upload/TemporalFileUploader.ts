import { Service } from 'diod';
import { extname } from 'node:path';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { canGenerateThumbnail } from '../../../../../backend/features/thumbnails/thumbnail.extensions';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';
import { TemporalFileUploaderFactory } from '../../domain/upload/TemporalFileUploaderFactory';
import { TemporalFileUploadedDomainEvent } from '../../domain/upload/TemporalFileUploadedDomainEvent';
import { EventBus } from '../../../../virtual-drive/shared/domain/EventBus';
import { Replaces } from '../../domain/upload/Replaces';
import { TemporalFile } from '../../domain/TemporalFile';
import { retryWithBackoff } from '../../../../../shared/retry-with-backoff';
import {
  createTransientErrorHandler,
  mapEnvironmentUploadError,
} from '../../../../../backend/common/rate-limit/transient-error-handler';
import { ContentsId } from '../../../../../apps/main/database/entities/DriveFile';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { Result } from '../../../../shared/domain/Result';
import configStore from '../../../../../apps/main/config';
import { addMaxFileSizeRejection } from '../../../../../backend/features/user/file-size-limit/add-max-file-size-rejection';
import { UploadSizeLimitError } from '../../../../../backend/features/user/file-size-limit/upload-size-limit-error';
import { validateUploadFileSize } from '../../../../../backend/features/user/file-size-limit/validate-upload-file-size';

@Service()
export class TemporalFileUploader {
  constructor(
    private readonly repository: TemporalFileRepository,
    private readonly uploaderFactory: TemporalFileUploaderFactory,
    private readonly eventBus: EventBus,
  ) {}

  async run(temporalFile: TemporalFile, replaces?: Replaces): Promise<ContentsId> {
    const validation = validateUploadFileSize({
      size: temporalFile.size.value,
      maxUploadFileSize: configStore.get('maxUploadFileSizeInBytes'),
    });

    if (!validation.allowed) {
      addMaxFileSizeRejection({ path: temporalFile.path.value, fileSize: temporalFile.size.value, validation });

      throw new UploadSizeLimitError();
    }
    const controller = new AbortController();
    const stopWatching = this.repository.watchFile(temporalFile.path, () => controller.abort());

    try {
      const contentsId = await this.uploadWithRetry(temporalFile, controller, replaces);

      logger.debug({ msg: `${temporalFile.path.value} uploaded with id ${contentsId}` });

      await this.publishUploadEvent(contentsId, temporalFile, replaces);

      return contentsId;
    } finally {
      stopWatching();
    }
  }

  private async uploadWithRetry(
    temporalFile: TemporalFile,
    controller: AbortController,
    replaces?: Replaces,
  ): Promise<ContentsId> {
    const errorHandler = createTransientErrorHandler({
      tag: 'SYNC-ENGINE',
      context: 'TEMPORAL FILE UPLOAD RETRY',
      path: temporalFile.path.value,
    });

    const { data: contentsId, error } = await retryWithBackoff(
      () => this.executeUpload(temporalFile, controller, replaces),
      errorHandler,
      controller.signal,
    );

    if (error) throw error;

    return contentsId;
  }

  private async executeUpload(
    temporalFile: TemporalFile,
    controller: AbortController,
    replaces?: Replaces,
  ): Promise<Result<ContentsId, DriveDesktopError>> {
    try {
      const stream = await this.repository.stream(temporalFile.path);

      const uploader = this.uploaderFactory
        .read(stream)
        .document(temporalFile)
        .replaces(replaces)
        .abort(controller)
        .build();

      const uploadedContentsId = await uploader();
      return { data: uploadedContentsId as ContentsId };
    } catch (uploadError) {
      return {
        error: mapEnvironmentUploadError(uploadError as Error & { status?: unknown }),
      };
    }
  }

  private async publishUploadEvent(
    contentsId: ContentsId,
    temporalFile: TemporalFile,
    replaces?: Replaces,
  ): Promise<void> {
    const fileBuffer = await this.getThumbnailBufferIfNeeded(temporalFile);

    const contentsUploadedEvent = new TemporalFileUploadedDomainEvent({
      aggregateId: contentsId,
      size: temporalFile.size.value,
      path: temporalFile.path.value,
      replaces: replaces?.contentsId,
      fileBuffer,
      contentFilePath: temporalFile.contentFilePath,
    });

    await this.eventBus.publish([contentsUploadedEvent]);
  }

  private async getThumbnailBufferIfNeeded(temporalFile: TemporalFile): Promise<Buffer | undefined> {
    const ext = extname(temporalFile.path.value).replace('.', '').toLowerCase();

    if (!canGenerateThumbnail(ext)) {
      return undefined;
    }

    return this.repository.read(temporalFile.path);
  }
}
