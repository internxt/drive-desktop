import { Environment } from '@internxt/inxt-js';
import { Readable } from 'stream';
import { StorageTypes, Storage } from '@internxt/sdk/dist/drive';
import { ThumbnailProperties } from '../ThumbnailProperties';

export class ThumbnailUploader {
  constructor(
    private readonly environment: Environment,
    private readonly storage: Storage,
    private readonly bucket: string
  ) {}

  private uploadThumbnail(thumbnail: Buffer) {
    const thumbnailStream = new Readable({
      read() {
        this.push(thumbnail);
        this.push(null);
      },
    });

    return new Promise<string>((resolve, reject) => {
      this.environment.upload(this.bucket, {
        progressCallback: () => {},
        finishedCallback: (err: unknown, id: string) => {
          if (err) reject(err);

          resolve(id);
        },
        source: thumbnailStream,
        fileSize: thumbnail.byteLength,
      });
    });
  }

  async upload(fileId: number, thumbnailFile: Buffer) {
    const fileIdOnEnvironment = await this.uploadThumbnail(thumbnailFile);

    const thumbnail: StorageTypes.ThumbnailEntry = {
      file_id: fileId,
      max_width: ThumbnailProperties.dimensions as number,
      max_height: ThumbnailProperties.dimensions as number,
      type: ThumbnailProperties.type as string,
      size: thumbnailFile.byteLength,
      bucket_id: this.bucket,
      bucket_file: fileIdOnEnvironment,
      encrypt_version: StorageTypes.EncryptionVersion.Aes03,
    };

    return this.storage.createThumbnailEntry(thumbnail);
  }
}