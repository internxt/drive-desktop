import { Environment } from '@internxt/inxt-js';
import { Service } from 'diod';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { generateThumbnail } from '../../../../../backend/features/thumbnails/generate-thumbnail';
import { uploadAndCreateThumbnail } from '../../../../../backend/features/thumbnails/upload-and-create-thumbnail';
import { TemporalFileUploadedDomainEvent } from '../../../../storage/TemporalFiles/domain/upload/TemporalFileUploadedDomainEvent';
import { DomainEventClass } from '../../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../../shared/domain/DomainEventSubscriber';
import { FileCreator } from './FileCreator';
import { FileOverrider } from '../override/FileOverrider';

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
      logger.error({
        msg: '[CreateFileOnOfflineFileUploaded] Error creating file:',
        error: err,
      });
    }
  }
}
