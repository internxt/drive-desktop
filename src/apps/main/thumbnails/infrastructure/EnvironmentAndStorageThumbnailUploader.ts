import { Environment } from '@internxt/inxt-js/build';
import { StorageTypes } from '@internxt/sdk/dist/drive';
import { Readable } from 'stream';

import { ThumbnailProperties } from '../domain/ThumbnailProperties';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

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
      return await promise;
    } catch (error) {
      return new Error(`Error uploading thumbnail to environment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async uploadThumbnailToStorage(fileIdOnEnvironment: string, fileId: number, thumbnailFile: Buffer) {
    const { error } = await driveServerWipModule.files.createThumbnail({
      body: {
        fileId,
        maxWidth: ThumbnailProperties.dimensions,
        maxHeight: ThumbnailProperties.dimensions,
        type: ThumbnailProperties.type,
        size: thumbnailFile.byteLength,
        bucketId: this.bucket,
        bucketFile: fileIdOnEnvironment,
        encryptVersion: StorageTypes.EncryptionVersion.Aes03,
      },
    });
    return error ? error : true;
  }

  async upload(fileId: number, thumbnailFile: Buffer): Promise<Error | true> {
    const uploadToEnvironmentResult = await this.uploadThumbnailToEnvironment(thumbnailFile);
    if (uploadToEnvironmentResult instanceof Error) {
      return uploadToEnvironmentResult;
    }

    const uploadToStorageResult = await this.uploadThumbnailToStorage(uploadToEnvironmentResult, fileId, thumbnailFile);
    return uploadToStorageResult instanceof Error ? uploadToStorageResult : true;
  }
}