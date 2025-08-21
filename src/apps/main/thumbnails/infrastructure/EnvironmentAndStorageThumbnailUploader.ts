import { components } from './../../../../infra/schemas.d';
import { Environment } from '@internxt/inxt-js';
import { Storage, StorageTypes } from '@internxt/sdk/dist/drive';
import { Readable } from 'stream';
import { ThumbnailProperties } from '../domain/ThumbnailProperties';
import { ThumbnailUploader } from '../domain/ThumbnailUploader';
import { createThumbnail } from '../../../../infra/drive-server/services/files/services/create-thumbnail';

export class EnvironmentAndStorageThumbnailUploader
  implements ThumbnailUploader
{
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  private uploadThumbnailToEnvironment(thumbnail: Buffer) {
    const thumbnailStream = new Readable({
      read() {
        this.push(thumbnail);
        this.push(null);
      },
    });

    return new Promise<string>((resolve, reject) => {
      this.environment.upload(this.bucket, {
        progressCallback: () => {
          // no op
        },
        finishedCallback: (err: unknown, id: string) => {
          if (err && !id) {
            reject(err);
          }

          resolve(id);
        },
        fileSize: thumbnail.byteLength,
        source: thumbnailStream,
      });
    });
  }

  private async uploadThumbnailToStorage(
    thumbnail: components['schemas']['CreateThumbnailDto']
  ) {
    return await createThumbnail(thumbnail);
  }

  async upload(fileId: number, thumbnailFile: Buffer): Promise<void> {
    const fileIdOnEnvironment = await this.uploadThumbnailToEnvironment(
      thumbnailFile
    );
    await this.uploadThumbnailToStorage({
      fileId,
      type: ThumbnailProperties.type as string,
      size: thumbnailFile.byteLength,
      maxWidth: ThumbnailProperties.dimensions as number,
      maxHeight: ThumbnailProperties.dimensions as number,
      bucketId: this.bucket,
      bucketFile: fileIdOnEnvironment,
      encryptVersion: StorageTypes.EncryptionVersion.Aes03,
    });
  }
}
