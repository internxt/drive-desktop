import { Environment } from '@internxt/inxt-js';
import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { addMaxFileSizeRejection } from '../../../../../backend/features/user/file-size-limit/add-max-file-size-rejection';
import { generateThumbnail } from '../../../../../backend/features/thumbnails/generate-thumbnail';
import { uploadAndCreateThumbnail } from '../../../../../backend/features/thumbnails/upload-and-create-thumbnail';
import { TemporalFileUploadedDomainEvent } from '../../../../storage/TemporalFiles/domain/upload/TemporalFileUploadedDomainEvent';
import { DomainEventClass } from '../../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../../shared/domain/DomainEventSubscriber';
import { DriveDesktopError } from '../../../../shared/domain/errors/DriveDesktopError';
import { FileCreator } from './FileCreator';
import { FileOverrider } from '../override/FileOverrider';
import { preserveRejectedFileSizeTooBig } from '../../../../../backend/features/user/file-size-limit';

@Service()
export class CreateFileOnTemporalFileUploaded implements DomainEventSubscriber<TemporalFileUploadedDomainEvent> {
  constructor(
    private readonly creator: FileCreator,
    private readonly fileOverrider: FileOverrider,
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  subscribedTo(): DomainEventClass[] {
    return [TemporalFileUploadedDomainEvent];
  }

  private async create(event: TemporalFileUploadedDomainEvent): Promise<void> {
    const file = event.replaces
      ? await this.fileOverrider.run(event.replaces, event.aggregateId, event.size)
      : await this.creator.run(event.path, event.aggregateId, event.size);

    if (event.fileBuffer) {
      const generated = generateThumbnail(event.fileBuffer);

      if (generated.error) {
        logger.warn({ msg: `Failed to generate thumbnail for ${event.path}`, error: generated.error });
        return;
      }

      void uploadAndCreateThumbnail({
        thumbnailBuffer: generated.data,
        fileUuid: file.uuid,
        environment: this.environment,
        bucket: this.bucket,
      }).then(({ error }) => {
        if (error) {
          logger.warn({ msg: `Failed to upload thumbnail for ${event.path}`, error });
        }
      });
    }
  }

  async on(event: TemporalFileUploadedDomainEvent): Promise<void> {
    try {
      await this.create(event);
    } catch (err) {
      if (err instanceof DriveDesktopError && err.cause === 'FILE_TOO_BIG') {
        const preserved = await this.preserveBackendRejectedFile(event);
        if (!preserved) {
          return;
        }

        addMaxFileSizeRejection({
          path: event.path,
          fileSize: event.size,
          blockUploadPath: false,
        });
        return;
      }

      logger.error({
        msg: '[CreateFileOnOfflineFileUploaded] Error creating file:',
        error: err,
      });
    }
  }

  private async preserveBackendRejectedFile(event: TemporalFileUploadedDomainEvent): Promise<boolean> {
    if (!event.contentFilePath) {
      logger.error({
        msg: '[CreateFileOnOfflineFileUploaded] Backend rejected oversized file but temporal content path is unavailable',
        path: event.path,
        size: event.size,
      });
      return false;
    }

    try {
      const { data, error } = await preserveRejectedFileSizeTooBig({
        originalPath: event.path,
        temporalContentPath: event.contentFilePath,
        size: event.size,
      });

      if (error) {
        logger.error({
          msg: '[CreateFileOnOfflineFileUploaded] Failed to preserve backend-rejected oversized file',
          error,
          path: event.path,
          size: event.size,
          temporalContentPath: event.contentFilePath,
        });
        return false;
      }

      logger.warn({
        msg: '[CreateFileOnOfflineFileUploaded] Backend rejected file because it exceeds upload size limit, preserved local copy',
        path: event.path,
        size: event.size,
        preservedFilePath: data.filePath,
      });
      return true;
    } catch (preserveError) {
      logger.error({
        msg: '[CreateFileOnOfflineFileUploaded] Failed to preserve backend-rejected oversized file',
        error: preserveError,
        path: event.path,
        size: event.size,
        temporalContentPath: event.contentFilePath,
      });
      return false;
    }
  }
}
