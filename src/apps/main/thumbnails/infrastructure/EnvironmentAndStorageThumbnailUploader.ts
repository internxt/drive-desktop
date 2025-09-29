import { Environment } from '@internxt/inxt-js/build';
import { StorageTypes } from '@internxt/sdk/dist/drive';
import { Readable } from 'node:stream';

import { ThumbnailProperties } from '../domain/ThumbnailProperties';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { logger } from '@/apps/shared/logger/logger';
import { FileUuid } from '../../database/entities/DriveFile';

export class EnvironmentAndStorageThumbnailUploader {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  async uploadThumbnailToEnvironment(thumbnail: Buffer) {
    const thumbnailStream = new Readable({
      read() {
        this.push(thumbnail);
        this.push(null);
      },
    });
    try {
      const promise = new Promise<string>((resolve, reject) => {
        this.environment.upload(this.bucket, {
          progressCallback: () => {
            // no op
          },
          finishedCallback: (err, id) => {
            if (id) {
              resolve(id);
            } else {
              reject(err);
            }
          },
          fileSize: thumbnail.byteLength,
          source: thumbnailStream,
        });
      });
      const data = await promise;
      return { data };
    } catch (error) {
      return { error: logger.error({ msg: 'Error uploading thumbnail to environment', error }) };
    }
  }

  async uploadThumbnailToStorage(fileIdOnEnvironment: string, fileUuid: FileUuid, thumbnailFile: Buffer) {
    return await driveServerWipModule.files.createThumbnail({
      body: {
        fileUuid,
        maxWidth: ThumbnailProperties.dimensions,
        maxHeight: ThumbnailProperties.dimensions,
        type: ThumbnailProperties.type,
        size: thumbnailFile.byteLength,
        bucketId: this.bucket,
        bucketFile: fileIdOnEnvironment,
        encryptVersion: StorageTypes.EncryptionVersion.Aes03,
      },
    });
  }

  async upload(fileUuid: FileUuid, thumbnailFile: Buffer): Promise<{ error: Error | undefined }> {
    const uploadToEnvironmentResult = await this.uploadThumbnailToEnvironment(thumbnailFile);
    if (uploadToEnvironmentResult.error) {
      return { error: uploadToEnvironmentResult.error };
    }

    const { error } = await this.uploadThumbnailToStorage(uploadToEnvironmentResult.data, fileUuid, thumbnailFile);
    return { error };
  }
}
