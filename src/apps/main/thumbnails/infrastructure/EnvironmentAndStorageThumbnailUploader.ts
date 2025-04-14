import { Environment } from '@internxt/inxt-js';
import { StorageTypes } from '@internxt/sdk/dist/drive';
import { Readable } from 'stream';

import { ThumbnailProperties } from '../domain/ThumbnailProperties';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

export class EnvironmentAndStorageThumbnailUploader {
  constructor(
    private readonly environment: Environment,
    private readonly bucket: string,
  ) {}

  private async uploadThumbnail(thumbnail: Buffer) {
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

  async upload(fileId: number, thumbnailFile: Buffer): Promise<void> {
    const fileIdOnEnvironment = await this.uploadThumbnail(thumbnailFile);

    await driveServerWipModule.files.createThumbnail({
      body: {
        fileId: fileId,
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
}
