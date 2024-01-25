import { Environment } from '@internxt/inxt-js';
import {
  OfflineContentUploader,
  OfflineContentsManagersFactory,
} from '../domain/OfflineContentsManagersFactory';
import { EnvironmentOfflineContentsUploader } from './EnvironmentOfflineContentsUploader';

export class EnvironmentOfflineContentsManagersFactory
  implements OfflineContentsManagersFactory
{
  private static MULTIPART_UPLOAD_SIZE_THRESHOLD = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly environment: Environment,
    private readonly bucket: string
  ) {}

  uploader(size: number, abortSignal?: AbortSignal): OfflineContentUploader {
    size;
    const fn =
      size >
      EnvironmentOfflineContentsManagersFactory.MULTIPART_UPLOAD_SIZE_THRESHOLD
        ? this.environment.uploadMultipartFile
        : this.environment.upload;

    return new EnvironmentOfflineContentsUploader(fn, this.bucket, abortSignal);
  }
}
